const { Transaction, Project, User, UserLedger } = require('../Models');
const userLedgerService = require('./user-ledger.service');
const auditLogService = require('./audit-log.service');
const notificationService = require('./notification.service');
const { Op } = require('sequelize');

class TransactionService {
  
    async getAll({ page = 1, perPage = 10, sort = 'DESC', sortColumn = 'date', ...filters }) {
        page = parseInt(page)
        perPage = parseInt(perPage)

        const offset = (page - 1) * perPage;

        const { id, UserId, ProjectId, IncludeAdmin, status, type } = filters;
        const includeAdminTransactions = ['1', 'true', true, 1].includes(IncludeAdmin);

        const whereClause = {};
        if (id) whereClause.id = id
        if(ProjectId) whereClause.ProjectId = ProjectId
        if (status) {
            whereClause.status = Array.isArray(status) ? { [Op.in]: status } : status
        }
        if (type) {
            whereClause.type = Array.isArray(type) ? { [Op.in]: type } : type
        }
        if(UserId) {
            if (includeAdminTransactions && ProjectId) {
                whereClause[Op.or] = [
                    { UserId },
                    { UserId: null }
                ]
            } else {
                whereClause.UserId = UserId
            }
        }

        const { count, rows } = await Transaction.findAndCountAll({
            where: whereClause,
            limit: perPage,
            offset: offset,
            include: [
                {
                    model: User,
                    as: 'User',
                    required: false
                },
                {
                    model: Project,
                    as: 'Project',
                    required: false
                }
            ],
            order: [[sortColumn, sort]]
        });

        return {
            totalRecords: count,
            totalPages: Math.ceil(count / perPage),
            currentPage: page,
            perPage,
            data: rows
        };
    }

    async create({ body, file, user, ip }) {
        const transactionUserId = user.role === "admin" ? body.UserId : user.id
        const ledger = await UserLedger.findOne({
            where: {
                UserId: transactionUserId, 
                ProjectId: body.ProjectId
            }
        })
        if (!ledger) throw "The project is not assigned to the user"

        const requestedAmount = toNumber(body.amount)
        
        if (body.type === "withdrawal") {
            const pendingWithdrawal = await getPendingAmount({
                UserId: transactionUserId,
                ProjectId: body.ProjectId,
                type: 'withdrawal'
            })
            const availableReturns = (toNumber(ledger.returns) - toNumber(ledger.withdrawal)) - pendingWithdrawal
            if (requestedAmount > availableReturns) {
                throw `You don't have enough returns! Available: ${formatAmount(Math.max(availableReturns, 0))}`
            }
        }

        if (body.type === "investment-withdrawal") {
            const pendingInvestmentWithdrawal = await getPendingAmount({
                UserId: transactionUserId,
                ProjectId: body.ProjectId,
                type: 'investment-withdrawal'
            })
            const availableInvestment = toNumber(ledger.investment) - pendingInvestmentWithdrawal
            if (requestedAmount > availableInvestment) {
                throw `You don't have enough investment! Available: ${formatAmount(Math.max(availableInvestment, 0))}`
            }
        }

        const transaction = new Transaction(body);
        if(file)
            transaction.receipt = `/uploads/${file.filename}`

        if(user.role === "admin"){
            transaction.status = "approved"
        } else {
            transaction.UserId = user.id
        }
        await transaction.save()
        await userLedgerService.walletSync(transaction)

        if (user.role !== "admin") {
            await notificationService.safeCreateForAdmins({
                title: 'New Transaction Submitted',
                message: `${user.name || 'A user'} submitted a ${formatTransactionType(transaction.type)} request for ${formatAmount(transaction.amount)}.`,
                category: 'warning',
                eventType: 'transaction_submitted',
                link: buildTransactionLink({
                    transactionId: transaction.id,
                    userId: transaction.UserId,
                    projectId: transaction.ProjectId,
                    includeAdmin: true
                }),
                metadata: {
                    transactionId: transaction.id,
                    userId: transaction.UserId,
                    projectId: transaction.ProjectId,
                    type: transaction.type,
                    amount: transaction.amount,
                    status: transaction.status
                }
            });
        } else if (transaction.UserId) {
            await notificationService.safeCreateForUser(transaction.UserId, {
                title: 'Transaction Created',
                message: `A ${formatTransactionType(transaction.type)} transaction for ${formatAmount(transaction.amount)} was created by admin.`,
                category: 'info',
                eventType: 'transaction_created_by_admin',
                link: buildTransactionLink({
                    transactionId: transaction.id,
                    userId: transaction.UserId,
                    projectId: transaction.ProjectId,
                    includeAdmin: true
                }),
                metadata: {
                    transactionId: transaction.id,
                    projectId: transaction.ProjectId,
                    type: transaction.type,
                    amount: transaction.amount,
                    status: transaction.status
                }
            });
        }

        if (user.role === "admin") {
            await auditLogService.log({
                actorUser: user,
                action: 'transaction_created',
                description: `Created transaction #${transaction.id} (${transaction.type}) for user #${transaction.UserId || 'N/A'}`,
                targetType: 'transaction',
                targetId: transaction.id,
                metadata: {
                    amount: transaction.amount,
                    status: transaction.status,
                    type: transaction.type,
                    UserId: transaction.UserId,
                    ProjectId: transaction.ProjectId,
                    hasReceipt: Boolean(transaction.receipt)
                },
                ipAddress: ip
            });
        }

        return transaction;
    }

    async getById(id) {
        return await Transaction.findByPk(id);
    }

    async countAll() {
        return await Transaction.count();
    }

    async update(id, params, file, actorUser, ipAddress) {
        const transaction = await this.getById(id);
        if (!transaction) throw "Transaction doesn't exist";
        const previousStatus = transaction.status;
        const previousAdminReceipt = transaction.adminReceipt;

        // copy params to user and save
        Object.assign(transaction, params);
        if(params.status === "approved"){
            const receiptRequiredForApproval = transaction.type !== "investment";
            if(receiptRequiredForApproval && !transaction.adminReceipt)
                throw "You must upload a receipt before approving the transaction!";

            if (previousStatus !== "approved") {
                const ledger = await UserLedger.findOne({
                    where: {
                        UserId: transaction.UserId,
                        ProjectId: transaction.ProjectId
                    }
                })

                if (!ledger) throw "The project is not assigned to the user"

                const amount = toNumber(transaction.amount)
                if (transaction.type === 'withdrawal') {
                    const availableReturns = toNumber(ledger.returns) - toNumber(ledger.withdrawal)
                    if (amount > availableReturns) {
                        throw `Insufficient returns balance for approval. Available: ${formatAmount(Math.max(availableReturns, 0))}`
                    }
                }

                if (transaction.type === 'investment-withdrawal') {
                    const availableInvestment = toNumber(ledger.investment)
                    if (amount > availableInvestment) {
                        throw `Insufficient investment balance for approval. Available: ${formatAmount(Math.max(availableInvestment, 0))}`
                    }
                }

                await userLedgerService.walletSync(transaction)
            }
        }

        if(file)
            transaction.adminReceipt = `/uploads/${file.filename}`    

        transaction.updated = Date.now();
        await transaction.save()

        const statusChanged = Boolean(params.status) && previousStatus !== transaction.status;

        if (statusChanged && transaction.UserId && isUserFacingTransactionType(transaction.type)) {
            await notificationService.safeCreateForUser(transaction.UserId, {
                title: `Transaction ${capitalizeWord(transaction.status)}`,
                message: `Your ${formatTransactionType(transaction.type)} request for ${formatAmount(transaction.amount)} was ${transaction.status}.`,
                category: transaction.status === 'approved' ? 'success' : transaction.status === 'rejected' ? 'danger' : 'info',
                eventType: 'transaction_status_updated',
                link: buildTransactionLink({
                    transactionId: transaction.id,
                    projectId: transaction.ProjectId
                }),
                metadata: {
                    transactionId: transaction.id,
                    projectId: transaction.ProjectId,
                    type: transaction.type,
                    amount: transaction.amount,
                    from: previousStatus,
                    to: transaction.status
                }
            });
        }

        if (actorUser?.role === "admin") {
            const adminReceiptUploaded = Boolean(file) && !previousAdminReceipt && Boolean(transaction.adminReceipt);

            if (statusChanged) {
                await auditLogService.log({
                    actorUser,
                    action: 'transaction_status_updated',
                    description: `Changed transaction #${transaction.id} status from ${previousStatus} to ${transaction.status}`,
                    targetType: 'transaction',
                    targetId: transaction.id,
                    metadata: {
                        from: previousStatus,
                        to: transaction.status,
                        type: transaction.type,
                        amount: transaction.amount,
                        UserId: transaction.UserId,
                        ProjectId: transaction.ProjectId
                    },
                    ipAddress
                });
            }

            if (adminReceiptUploaded) {
                await auditLogService.log({
                    actorUser,
                    action: 'transaction_admin_receipt_uploaded',
                    description: `Uploaded admin receipt for transaction #${transaction.id}`,
                    targetType: 'transaction',
                    targetId: transaction.id,
                    metadata: {
                        status: transaction.status,
                        type: transaction.type,
                        UserId: transaction.UserId,
                        ProjectId: transaction.ProjectId
                    },
                    ipAddress
                });
            }

            if (!statusChanged && !adminReceiptUploaded) {
                await auditLogService.log({
                    actorUser,
                    action: 'transaction_updated',
                    description: `Updated transaction #${transaction.id}`,
                    targetType: 'transaction',
                    targetId: transaction.id,
                    metadata: {
                        fields: Object.keys(params || {}),
                        UserId: transaction.UserId,
                        ProjectId: transaction.ProjectId
                    },
                    ipAddress
                });
            }
        }

        return transaction;
    }

    async countByType(type, UserId) {
        return await Transaction.count({
            where: { type, UserId }
        });
    }

    async delete(id) {
        const user = await getTransaction(id);
        await user.destroy();
    }
}

module.exports = new TransactionService();

function isUserFacingTransactionType(type) {
    return ['investment', 'withdrawal', 'investment-withdrawal'].includes(String(type || '').toLowerCase());
}

function formatTransactionType(type) {
    const normalized = String(type || '').replace('-', ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatAmount(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return `${value}`;
    return `AED ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function capitalizeWord(value) {
    const str = String(value || '');
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildTransactionLink({ transactionId, userId, projectId, includeAdmin } = {}) {
    const query = new URLSearchParams();
    if (transactionId) query.set('id', String(transactionId));
    if (userId) query.set('userId', String(userId));
    if (projectId) query.set('projectId', String(projectId));
    if (includeAdmin && userId && projectId) query.set('includeAdmin', '1');
    const serialized = query.toString();
    return serialized ? `/transactions?${serialized}` : '/transactions';
}

function toNumber(value) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

async function getPendingAmount({ UserId, ProjectId, type }) {
    const sum = await Transaction.sum('amount', {
        where: {
            UserId,
            ProjectId,
            type,
            status: 'pending'
        }
    })
    return toNumber(sum)
}
