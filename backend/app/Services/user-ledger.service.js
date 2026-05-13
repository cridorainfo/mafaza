const Sequelize = require("sequelize");
const { UserLedger, Project, User, Transaction } = require("../Models");
const { fn, col, literal, Op } = require("sequelize");
const notificationService = require("./notification.service");

const RETURN_PERIODS = {
    quarterly: { months: 3, divisionFactor: 4 },
    "semi-annual": { months: 6, divisionFactor: 2 },
    annual: { months: 12, divisionFactor: 1 },
    testing: { hours: 3, divisionFactor: 365 * 8 },
};
const RETURN_PAYMENT_DATES = {
    quarterly: [
        { month: 2, day: 31 },  // Mar 31
        { month: 5, day: 30 },  // Jun 30
        { month: 8, day: 31 },  // Sep 31 -> normalized to Sep 30
        { month: 11, day: 31 }, // Dec 31
    ],
    "semi-annual": [
        { month: 5, day: 30 },  // Jun 30
        { month: 11, day: 31 }, // Dec 31
    ],
    annual: [
        { month: 11, day: 31 }, // Dec 31
    ],
};
const INVESTMENT_TRANSACTION_TYPES = ["investment", "investment-withdrawal"];
const PAYOUT_OFFSET_MS = 4 * 60 * 60 * 1000; // Asia/Dubai (UTC+04:00)
const MS_IN_YEAR = 365 * 24 * 60 * 60 * 1000;

class UserLedgerService {
    async getAll({
        page = 1,
        perPage = 10,
        sort = "DESC",
        sortColumn = "createdAt",
        q,
        ...filters
    }) {
        page = parseInt(page);
        perPage = parseInt(perPage);

        const offset = (page - 1) * perPage;

        const { UserId } = filters;
        const whereClause = {};
        if (UserId) whereClause.UserId = UserId;

        const normalizedQuery = String(q || "").trim();
        if (!UserId && normalizedQuery) {
            const likeOperator = User.sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
            const users = await User.findAll({
                attributes: ["id"],
                where: {
                    [Op.or]: [
                        { name: { [likeOperator]: `%${normalizedQuery}%` } },
                        { email: { [likeOperator]: `%${normalizedQuery}%` } },
                        { phoneNumber: { [likeOperator]: `%${normalizedQuery}%` } }
                    ]
                },
                raw: true
            });

            const matchedUserIds = users.map(user => user.id);
            if (matchedUserIds.length === 0) {
                return {
                    totalRecords: 0,
                    totalPages: 0,
                    currentPage: page,
                    perPage,
                    data: []
                };
            }

            whereClause.UserId = { [Op.in]: matchedUserIds };
        }

        const queryOptions = {
            where: whereClause,
            limit: perPage,
            offset: offset,
        };

        if (UserId) {
            queryOptions.order = [[sortColumn, sort]];
            queryOptions.include = [
                {
                    model: User,
                    as: "User",
                    required: false,
                },
                {
                    model: Project,
                    as: "Project",
                    required: false,
                },
            ];
        } else {
            queryOptions.include = [
                {
                    model: User,
                    as: "User",
                    required: false,
                },
            ];
            const dialect = UserLedger.sequelize.getDialect();
            const projectIdsAggregate =
                dialect === "postgres"
                    ? [literal('STRING_AGG(DISTINCT "ProjectId"::text, \',\')'), "projects"]
                    : [
                        Sequelize.fn(
                            "GROUP_CONCAT",
                            Sequelize.fn("DISTINCT", Sequelize.col("ProjectId"))
                        ),
                        "projects",
                    ];

            queryOptions.attributes = [
                "UserId",
                [Sequelize.fn("SUM", Sequelize.col("investment")), "investment"],
                [Sequelize.fn("SUM", Sequelize.col("withdrawal")), "withdrawal"],
                [Sequelize.fn("SUM", Sequelize.col("returns")), "returns"],
                [Sequelize.fn("MAX", Sequelize.col("UserLedger.updatedAt")), "date"],
                [Sequelize.fn("MAX", Sequelize.col("UserLedger.updatedAt")), "updatedAt"],
                [Sequelize.fn("MAX", Sequelize.col("UserLedger.createdAt")), "createdAt"],
                projectIdsAggregate,
            ];
            queryOptions.group = ["UserLedger.UserId", "User.id"];
        }

        const { count, rows } = await UserLedger.findAndCountAll(queryOptions);
        const totalRecords = Array.isArray(count) ? count.length : count;

        let data = rows;

        if (!UserId) {
            const allProjectIds = new Set();
            const userIds = [...new Set(rows.map(row => row.UserId))];
            // Collect project IDs from all rows
            for (const row of rows) {
                const projectIds = row.getDataValue("projects")?.split(",") || [];
                projectIds.forEach((id) => allProjectIds.add(id));

            }

            const projectDetails = await Project.findAll({
                where: { id: [...allProjectIds] },
                include: [
                    {
                        model: UserLedger,
                        as: "ledgers",
                        where: { UserId: userIds },
                        required: false
                    },
                ]
            });

            const projectMap = {};
            projectDetails.forEach((project) => {
                projectMap[project.id] = project;
            });

            // Attach full project details to each row
            data = rows.map((row) => {
                const projectIds = row.getDataValue("projects")?.split(",") || [];
                const detailedProjects = projectIds
                    .map((id) => projectMap[id])
                    .filter(Boolean)
                    // Map only the ledger that is assigned to the user
                    .map((project) => {
                        const ledger = project.ledgers.find((l) => l.UserId === row.UserId);
                        return {
                            ...project.toJSON(),
                            ledger: ledger ? {
                                ledgerId: ledger.id,
                                investment: ledger.investment,
                                withdrawal: ledger.withdrawal,
                                returns: ledger.returns,
                                roi: ledger.roi,
                                returnPeriod: ledger.returnPeriod,
                                createdAt: ledger.createdAt,
                                updatedAt: ledger.updatedAt,
                            } : null,
                        };
                    });
                return {
                    ...row.toJSON(),
                    projectDetails: detailedProjects,
                };
            });
        }

        return {
            totalRecords,
            totalPages: Math.ceil(totalRecords / perPage),
            currentPage: page,
            perPage,
            data,
        };
    }

    async countAssigned(UserId) {
        return await UserLedger.count({ where: { UserId } });
    }

    async totalField(field, UserId) {
        const whereClause = UserId ? { UserId } : {};
        return await UserLedger.sum(field, { where: whereClause });
    }

    async avgRoi(UserId) {
        const whereClause = UserId ? { UserId } : {};
        const result = await UserLedger.findOne({
            where: whereClause,
            attributes: [[fn("AVG", col("roi")), "averageROI"]],
            raw: true,
        });

        return parseFloat(result.averageROI);
    }

    async getNextPaymentSchedule(UserId) {
        const ledgers = await UserLedger.findAll({
            where: {
                UserId,
                investment: {
                    [Sequelize.Op.gt]: 0
                }
            },
            include: [
                {
                    model: Project,
                    as: 'Project',
                    required: false
                }
            ],
            order: [['updatedAt', 'DESC']]
        });

        if (!ledgers.length) return [];

        const transactions = await Transaction.findAll({
            where: {
                UserId,
                status: 'approved',
                type: {
                    [Sequelize.Op.in]: ['return', 'investment', 'investment-withdrawal']
                }
            },
            attributes: ['ProjectId', 'type', 'date'],
            raw: true
        });

        const txByProject = transactions.reduce((result, tx) => {
            if (!result[tx.ProjectId]) {
                result[tx.ProjectId] = {
                    lastReturnDate: null,
                    lastInvestmentDate: null
                };
            }

            const date = tx.date ? new Date(tx.date) : null;
            if (!date || Number.isNaN(date.getTime())) return result;

            if (tx.type === 'return') {
                const current = result[tx.ProjectId].lastReturnDate;
                if (!current || date > current) result[tx.ProjectId].lastReturnDate = date;
            }

            if (['investment', 'investment-withdrawal'].includes(tx.type)) {
                const current = result[tx.ProjectId].lastInvestmentDate;
                if (!current || date > current) result[tx.ProjectId].lastInvestmentDate = date;
            }

            return result;
        }, {});

        return ledgers.map(ledger => {
            const expectedReturn = calculateExpectedReturn(
                ledger.investment,
                ledger.roi,
                ledger.returnPeriod
            );

            const projectTx = txByProject[ledger.ProjectId] || {};
            const baseDate =
                projectTx.lastReturnDate ||
                projectTx.lastInvestmentDate ||
                ledger.createdAt;

            return {
                ledgerId: ledger.id,
                projectId: ledger.ProjectId,
                projectName: ledger.Project?.name || 'N/A',
                investment: Number(ledger.investment) || 0,
                roi: Number(ledger.roi) || 0,
                returnPeriod: ledger.returnPeriod || 'N/A',
                expectedReturn: Number(expectedReturn.toFixed(2)),
                nextPaymentDate: getNextPaymentDate(baseDate, ledger.returnPeriod),
                lastReturnDate: projectTx.lastReturnDate || null
            };
        });
    }

    async assignProject({ body }) {
        const { UserId, ProjectId } = body;
        const existingAssignee = await UserLedger.findOne({
            where: {
                UserId,
                ProjectId,
            },
        });
        if (existingAssignee) throw "The user is already assigned to this project!";

        const ledger = new UserLedger({
            ...body,
            withdrawal: 0,
            returns: 0,
            investment: 0,
        });
        await ledger.save();

        const project = await Project.findByPk(ProjectId);
        await notificationService.safeCreateForUser(UserId, {
            title: 'Assigned To Project',
            message: `You have been assigned to project "${project?.name || `#${ProjectId}`}".`,
            category: 'info',
            eventType: 'project_assigned',
            link: `/transactions?projectId=${ProjectId}`,
            metadata: {
                projectId: ProjectId,
                projectName: project?.name || null,
                ledgerId: ledger.id
            }
        });

        return ledger;
    }

    async walletSync(transaction) {
        const { UserId, ProjectId, amount, type, status, date } = transaction;
        if (!status || status !== "approved") return;
        const userLedger = await UserLedger.findOne({
            where: {
                UserId,
                ProjectId,
            },
        });
        if (!userLedger) throw "The project is not assigned to the user";

        let investmentChange = 0;
        if (type === "investment") {
            investmentChange = parseFloat(amount);
            userLedger.investment =
                parseFloat(userLedger.investment) + parseFloat(amount);
        } else if (type === "investment-withdrawal") {
            investmentChange = -1 * parseFloat(amount);
            userLedger.investment =
                parseFloat(userLedger.investment) - parseFloat(amount);
        } else if (type === "withdrawal") {
            userLedger.withdrawal =
                parseFloat(userLedger.withdrawal) + parseFloat(amount);
        }

        userLedger.updated = Date.now();
        await userLedger.save();

        if (["investment", "investment-withdrawal"].includes(type)) {
            await this.recalculateFutureReturns(
                UserId,
                ProjectId,
                date,
                investmentChange,
                userLedger
            );
        }
        return userLedger;
    }

    async recalculateFutureReturns(UserId, ProjectId, fromDate, investmentChange, userLedger, options = {}) {
        const txn = options.transaction;
        const { returnPeriod } = userLedger;
        const fixedDates = RETURN_PAYMENT_DATES[returnPeriod];
        const returnNarration = typeof options.returnNarration === "string"
            ? options.returnNarration
            : `${returnPeriod} return (recalculated)`;

        const start = new Date(fromDate);
        if (Number.isNaN(start.getTime())) return;

        const returnDestroyWhere = {
            UserId,
            ProjectId,
            type: "return",
            status: "approved",
            date: {
                [Sequelize.Op.gt]: start
            }
        };

        if (options.purgeReturnNarrationLike) {
            returnDestroyWhere.narration = {
                [Sequelize.Op.like]: options.purgeReturnNarrationLike
            };
        }

        if (!fixedDates || !fixedDates.length) {
            await Transaction.destroy({
                where: returnDestroyWhere,
                transaction: txn
            });

            const now = new Date();
            const newReturns = [];
            let currentDate = addReturnInterval(start, returnPeriod);
            while (currentDate && currentDate <= now) {
                const returnAmount = roundCurrency(calculateExpectedReturn(userLedger.investment, userLedger.roi, returnPeriod));
                if (returnAmount > 0) {
                    newReturns.push({
                        amount: returnAmount,
                        type: "return",
                        date: new Date(currentDate),
                        narration: returnNarration,
                        status: "approved",
                        ProjectId,
                        UserId
                    });
                }

                currentDate = addReturnInterval(currentDate, returnPeriod);
            }

            if (newReturns.length > 0) {
                await Transaction.bulkCreate(newReturns, { transaction: txn });
            }

            const totalReturns = await Transaction.sum("amount", {
                where: {
                    UserId,
                    ProjectId,
                    type: "return",
                    status: "approved"
                },
                transaction: txn
            });
            userLedger.returns = toNumber(totalReturns);
            await userLedger.save({ transaction: txn });
            return;
        }

        // Step 1: Delete matching approved future return transactions (all, or narrowed for migration reruns)
        await Transaction.destroy({
            where: returnDestroyWhere,
            transaction: txn
        });

        // Step 2: Regenerate approved returns at each payout boundary until now
        const now = new Date();
        const payoutDates = getPayoutDatesBetween(start, now, fixedDates);
        const newReturns = [];

        for (const periodEnd of payoutDates) {
            const periodStart = getPreviousFixedPaymentDate(periodEnd, fixedDates);
            if (!periodStart) continue;

            const returnAmount = await this.calculateProratedReturnAmount({
                UserId,
                ProjectId,
                roi: userLedger.roi,
                periodStart,
                periodEnd,
                transaction: txn
            });

            if (returnAmount <= 0) continue;

            newReturns.push({
                amount: returnAmount,
                type: "return",
                date: new Date(periodEnd),
                narration: returnNarration,
                status: "approved",
                ProjectId,
                UserId
            });
        }

        if (newReturns.length > 0) {
            await Transaction.bulkCreate(newReturns, { transaction: txn });
        }

        // Step 3: Sync ledger return balance with approved return transactions
        const totalReturns = await Transaction.sum("amount", {
            where: {
                UserId,
                ProjectId,
                type: "return",
                status: "approved"
            },
            transaction: txn
        });
        userLedger.returns = toNumber(totalReturns);
        await userLedger.save({ transaction: txn });
    }

    /**
     * Used by migration import: seed baseline investment transaction and rebuild accrued returns until now,
     * without deleting non-migration cron return rows when purging reruns (see purgeReturnNarrationLike).
     */
    async migrationBootstrapOpeningBalances({ UserId, ProjectId, investment, ledger, anchorDate, transaction: txn }) {
        const INV = '[migration] opening investment';
        const BOOT = '%(migration bootstrap)%';

        await Transaction.destroy({
            where: {
                UserId,
                ProjectId,
                status: 'approved',
                [Op.or]: [
                    {
                        type: 'investment',
                        narration: { [Op.like]: '[migration]%' }
                    },
                    {
                        type: 'return',
                        narration: { [Op.like]: BOOT }
                    }
                ]
            },
            transaction: txn
        });

        const investmentAmount = roundCurrency(Number(investment) || 0);
        const start = new Date(anchorDate);
        if (!Number.isFinite(investmentAmount) || investmentAmount <= 0 || Number.isNaN(start.getTime())) {
            ledger.returns = 0;
            await ledger.save({ transaction: txn });
            return ledger;
        }

        await Transaction.create({
            UserId,
            ProjectId,
            amount: investmentAmount,
            type: 'investment',
            date: start,
            narration: INV,
            status: 'approved'
        }, { transaction: txn });

        await this.recalculateFutureReturns(
            UserId,
            ProjectId,
            start,
            investmentAmount,
            ledger,
            {
                transaction: txn,
                purgeReturnNarrationLike: BOOT,
                returnNarration: `${ledger.returnPeriod} return (migration bootstrap)`
            }
        );

        const fresh = await UserLedger.findOne({
            where: { UserId, ProjectId },
            transaction: txn
        });
        return fresh || ledger;
    }

    async calculateReturns(returnPeriod) {
        const ledgers = await UserLedger.findAll({
            where: { returnPeriod },
        });
        if (!ledgers.length) return;

        const fixedDates = RETURN_PAYMENT_DATES[returnPeriod];
        if (!fixedDates || !fixedDates.length) {
            for (const ledger of ledgers) {
                if (toNumber(ledger.investment) > 0) {
                    await this.proccessReturn(ledger);
                }
            }
            return;
        }

        const now = new Date();
        const periodEnd = getCurrentPayoutDate(now, fixedDates) || getPreviousFixedPaymentDate(now, fixedDates);
        if (!periodEnd) return;
        const periodStart = getPreviousFixedPaymentDate(periodEnd, fixedDates);
        if (!periodStart) return;

        for (const ledger of ledgers) {
            await this.proccessReturn(ledger, { periodStart, periodEnd });
        }
    }

    async proccessReturn(ledger, { periodStart = null, periodEnd = null } = {}) {
        const { roi, investment, returnPeriod, ProjectId, UserId } = ledger;
        let returns = calculateExpectedReturn(investment, roi, returnPeriod);
        const fixedDates = RETURN_PAYMENT_DATES[returnPeriod];

        if (fixedDates && periodStart && periodEnd) {
            const existingReturn = await Transaction.findOne({
                where: {
                    UserId,
                    ProjectId,
                    type: "return",
                    status: "approved",
                    date: new Date(periodEnd)
                },
                attributes: ["id"],
                raw: true
            });
            if (existingReturn) return;

            returns = await this.calculateProratedReturnAmount({
                UserId,
                ProjectId,
                roi,
                periodStart,
                periodEnd
            });
        }

        const roundedReturn = roundCurrency(returns);
        if (roundedReturn <= 0) return;

        const transaction = new Transaction({
            amount: roundedReturn,
            type: "return",
            date: periodEnd ? new Date(periodEnd) : new Date(),
            narration: `${returnPeriod} return`,
            status: "approved",
            ProjectId,
            UserId,
        });

        ledger.returns = toNumber(ledger.returns) + roundedReturn;

        await transaction.save();
        await ledger.save();
        const project = await Project.findByPk(ProjectId);
        await notificationService.safeCreateForUser(UserId, {
            title: 'Returns Generated',
            message: `${returnPeriod} return of ${formatAmount(roundedReturn)} was generated for ${project?.name || `project #${ProjectId}`}.`,
            category: 'success',
            eventType: 'return_generated',
            link: `/transactions?projectId=${ProjectId}`,
            metadata: {
                transactionId: transaction.id,
                projectId: ProjectId,
                projectName: project?.name || null,
                amount: roundedReturn,
                returnPeriod
            }
        });
        console.log("Return successfully added!");
    }

    async calculateProratedReturnAmount({ UserId, ProjectId, roi, periodStart, periodEnd, transaction: txn }) {
        const roiValue = toNumber(roi);
        if (roiValue <= 0) return 0;

        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
            return 0;
        }

        const transactions = await Transaction.findAll({
            where: {
                UserId,
                ProjectId,
                status: "approved",
                type: { [Sequelize.Op.in]: INVESTMENT_TRANSACTION_TYPES },
                date: { [Sequelize.Op.lt]: end }
            },
            attributes: ["type", "amount", "date"],
            order: [["date", "ASC"], ["id", "ASC"]],
            raw: true,
            transaction: txn
        });

        let principal = 0;
        const events = [];

        for (const transaction of transactions) {
            const eventDate = new Date(transaction.date);
            if (Number.isNaN(eventDate.getTime())) continue;

            const delta = getInvestmentDelta(transaction);
            if (!delta) continue;

            if (eventDate < start) {
                principal += delta;
                continue;
            }

            events.push({ date: eventDate, delta });
        }

        let accrued = 0;
        let cursor = new Date(start);
        for (const event of events) {
            if (event.date > cursor && principal > 0) {
                accrued += calculateSegmentReturn(principal, roiValue, cursor, event.date);
            }

            principal += event.delta;
            cursor = event.date;
        }

        if (end > cursor && principal > 0) {
            accrued += calculateSegmentReturn(principal, roiValue, cursor, end);
        }

        return roundCurrency(accrued);
    }

    async getById(id) {
        return await UserLedger.findByPk(id);
    }

    async update(id, params) {
        const userLedger = await this.getById(id);
        if (!userLedger) throw "User ledger doesn't exist";
        const previousRoi = userLedger.roi;

        // copy params to user and save
        Object.assign(userLedger, params);
        console.log(params)
        userLedger.updated = Date.now();
        await userLedger.save()

        if (Object.prototype.hasOwnProperty.call(params || {}, 'roi') && Number(params.roi) !== Number(previousRoi)) {
            const project = await Project.findByPk(userLedger.ProjectId);
            await notificationService.safeCreateForUser(userLedger.UserId, {
                title: 'ROI Updated',
                message: `Your ROI for ${project?.name || `project #${userLedger.ProjectId}`} was updated from ${previousRoi}% to ${userLedger.roi}%.`,
                category: 'info',
                eventType: 'ledger_roi_updated',
                link: '/ledger',
                metadata: {
                    ledgerId: userLedger.id,
                    projectId: userLedger.ProjectId,
                    projectName: project?.name || null,
                    from: previousRoi,
                    to: userLedger.roi
                }
            });
        }

        return userLedger;
    }
}

module.exports = new UserLedgerService();

function getReturnPeriodConfig(returnPeriod) {
    return RETURN_PERIODS[returnPeriod] || RETURN_PERIODS.annual;
}

function addReturnInterval(date, returnPeriod) {
    const nextDate = new Date(date);
    if (Number.isNaN(nextDate.getTime())) return null;

    const config = getReturnPeriodConfig(returnPeriod);
    const fixedDates = RETURN_PAYMENT_DATES[returnPeriod];

    if (config.hours) {
        nextDate.setHours(nextDate.getHours() + config.hours);
        return nextDate;
    }

    if (fixedDates && fixedDates.length) {
        return getNextFixedPaymentDate(nextDate, fixedDates);
    }

    nextDate.setMonth(nextDate.getMonth() + config.months);
    return nextDate;
}

function calculateExpectedReturn(investment, roi, returnPeriod) {
    const amount = Number(investment) || 0;
    const roiValue = Number(roi) || 0;
    const { divisionFactor } = getReturnPeriodConfig(returnPeriod);

    return (amount * (roiValue / 100)) / divisionFactor;
}

function getNextPaymentDate(baseDate, returnPeriod) {
    const date = new Date(baseDate);
    if (Number.isNaN(date.getTime())) return null;

    const now = new Date();
    const nextDate = new Date(date);

    // Keep moving payment date until it is in the future.
    while (nextDate <= now) {
        const updatedDate = addReturnInterval(nextDate, returnPeriod);
        if (!updatedDate || Number.isNaN(updatedDate.getTime())) return null;
        nextDate.setTime(updatedDate.getTime());
    }

    return nextDate;
}

function getNextFixedPaymentDate(referenceDate, fixedDates) {
    const reference = new Date(referenceDate);
    if (Number.isNaN(reference.getTime())) return null;

    const { year } = getPayoutDateParts(reference);
    const candidates = [];
    for (let offset = 0; offset <= 1; offset += 1) {
        const targetYear = year + offset;
        fixedDates.forEach(({ month, day }) => {
            candidates.push(createNormalizedDate(targetYear, month, day));
        });
    }

    candidates.sort((a, b) => a.getTime() - b.getTime());
    const upcoming = candidates.find(candidate => candidate > reference);
    if (upcoming) return upcoming;

    const sortedFixedDates = [...fixedDates].sort(
        (a, b) => (a.month - b.month) || (a.day - b.day)
    );
    const firstDate = sortedFixedDates[0];
    return createNormalizedDate(year + 2, firstDate.month, firstDate.day);
}

function getPreviousFixedPaymentDate(referenceDate, fixedDates) {
    const reference = new Date(referenceDate);
    if (Number.isNaN(reference.getTime())) return null;

    const { year } = getPayoutDateParts(reference);
    const candidates = [];
    for (let offset = -1; offset <= 0; offset += 1) {
        const targetYear = year + offset;
        fixedDates.forEach(({ month, day }) => {
            candidates.push(createNormalizedDate(targetYear, month, day));
        });
    }

    candidates.sort((a, b) => a.getTime() - b.getTime());
    const previous = [...candidates].reverse().find(candidate => candidate < reference);
    if (previous) return previous;

    const sortedFixedDates = [...fixedDates].sort(
        (a, b) => (a.month - b.month) || (a.day - b.day)
    );
    const lastDate = sortedFixedDates[sortedFixedDates.length - 1];
    return createNormalizedDate(year - 2, lastDate.month, lastDate.day);
}

function getCurrentPayoutDate(referenceDate, fixedDates) {
    const reference = new Date(referenceDate);
    if (Number.isNaN(reference.getTime())) return null;

    const { year, month, day } = getPayoutDateParts(reference);
    const match = fixedDates.find((entry) => {
        const candidate = createNormalizedDate(year, entry.month, entry.day);
        const candidateParts = getPayoutDateParts(candidate);
        return candidateParts.month === month && candidateParts.day === day;
    });

    if (!match) return null;
    return createNormalizedDate(year, match.month, match.day);
}

function getPayoutDatesBetween(fromDate, toDate, fixedDates) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) return [];

    const dates = [];
    let cursor = getNextFixedPaymentDate(from, fixedDates);
    while (cursor && cursor <= to) {
        dates.push(cursor);
        cursor = getNextFixedPaymentDate(cursor, fixedDates);
    }

    return dates;
}

function createNormalizedDate(year, month, day) {
    const maxDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const normalizedDay = Math.min(day, maxDay);
    return createPayoutDate(year, month, normalizedDay);
}

function getPayoutDateParts(date) {
    const shifted = new Date(date.getTime() + PAYOUT_OFFSET_MS);
    return {
        year: shifted.getUTCFullYear(),
        month: shifted.getUTCMonth(),
        day: shifted.getUTCDate(),
        hour: shifted.getUTCHours(),
        minute: shifted.getUTCMinutes(),
        second: shifted.getUTCSeconds(),
        millisecond: shifted.getUTCMilliseconds(),
    };
}

function createPayoutDate(year, month, day, hour = 0, minute = 0, second = 0, millisecond = 0) {
    return new Date(Date.UTC(year, month, day, hour, minute, second, millisecond) - PAYOUT_OFFSET_MS);
}

function calculateSegmentReturn(principal, annualRoi, startDate, endDate) {
    const durationMs = new Date(endDate).getTime() - new Date(startDate).getTime();
    if (durationMs <= 0 || principal <= 0 || annualRoi <= 0) return 0;

    return principal * (annualRoi / 100) * (durationMs / MS_IN_YEAR);
}

function getInvestmentDelta(transaction) {
    const amount = toNumber(transaction.amount);
    if (transaction.type === "investment") return amount;
    if (transaction.type === "investment-withdrawal") return -amount;
    return 0;
}

function roundCurrency(value) {
    const amount = toNumber(value);
    return Math.round(amount * 100) / 100;
}

function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return `${value}`;
    return `AED ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
