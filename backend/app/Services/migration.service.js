const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Role = require('../../config/role');
const {
    User,
    Project,
    UserLedger,
    Transaction,
    UserSecurity
} = require('../Models');
const zeptoMailService = require('./zeptomail.service');

const ALLOWED_USER_ROLES = new Set([Role.Admin, Role.User]);
const ALLOWED_USER_STATUSES = new Set(['verified', 'inactive', 'pending']);
const ALLOWED_RETURN_PERIODS = new Set(['annual', 'semi-annual', 'quarterly', 'testing']);

class MigrationService {
    async getTemplate() {
        return {
            generatedAt: new Date().toISOString(),
            users: [
                {
                    email: 'investor@example.com',
                    name: 'Investor One',
                    phoneNumber: '+971500000000',
                    address: 'Dubai, UAE',
                    country: 'United Arab Emirates',
                    role: 'user',
                    status: 'verified'
                }
            ],
            projects: [
                {
                    project_code: 'GOLDEN-HILLS-001',
                    name: 'Golden Hills',
                    totalInvestement: 500000,
                    minROI: 8,
                    maxROI: 12,
                    description: 'Sample project',
                    isActive: true
                }
            ],
            assignments: [
                {
                    user_email: 'investor@example.com',
                    project_code: 'GOLDEN-HILLS-001',
                    roi: 10,
                    returnPeriod: 'annual',
                    date: new Date().toISOString().slice(0, 10),
                    investment: 10000,
                    returns: 800,
                    withdrawal: 200
                }
            ],
            notes: [
                'Use users.email as unique key.',
                'Use projects.project_code as unique key inside the file.',
                'Assignments link user_email + project_code.',
                'Assignments can include investment, returns, withdrawal opening balances.',
                'Passwords are auto-generated for newly created users and emailed via ZeptoMail.'
            ]
        };
    }

    async exportData() {
        const [users, projects, ledgers, transactions] = await Promise.all([
            User.findAll({
                attributes: ['email', 'name', 'phoneNumber', 'address', 'country', 'role', 'status'],
                order: [['createdAt', 'ASC']]
            }),
            Project.findAll({
                attributes: ['id', 'name', 'totalInvestement', 'minROI', 'maxROI', 'description', 'isActive'],
                order: [['createdAt', 'ASC']]
            }),
            UserLedger.findAll({
                attributes: ['id', 'roi', 'returnPeriod', 'investment', 'returns', 'withdrawal', 'createdAt', 'UserId', 'ProjectId'],
                include: [
                    { model: User, as: 'User', attributes: ['email'], required: false },
                    { model: Project, as: 'Project', attributes: ['id', 'name'], required: false }
                ],
                order: [['createdAt', 'ASC']]
            }),
            Transaction.findAll({
                attributes: ['date', 'amount', 'type', 'narration', 'status', 'UserId', 'ProjectId'],
                include: [
                    { model: User, as: 'User', attributes: ['email'], required: false },
                    { model: Project, as: 'Project', attributes: ['id', 'name'], required: false }
                ],
                order: [['date', 'ASC']]
            })
        ]);

        const projectCodeById = {};
        const exportedProjects = projects.map(project => {
            const projectCode = toProjectCode(project.name, project.id);
            projectCodeById[project.id] = projectCode;

            return {
                project_code: projectCode,
                name: project.name,
                totalInvestement: project.totalInvestement,
                minROI: project.minROI,
                maxROI: project.maxROI,
                description: project.description,
                isActive: Boolean(project.isActive)
            };
        });

        const exportedAssignments = ledgers.map(ledger => ({
            user_email: ledger.User?.email || '',
            project_code: projectCodeById[ledger.ProjectId] || toProjectCode(ledger.Project?.name, ledger.ProjectId),
            roi: ledger.roi,
            returnPeriod: ledger.returnPeriod,
            date: formatDate(ledger.createdAt),
            investment: Number(ledger.investment || 0),
            returns: Number(ledger.returns || 0),
            withdrawal: Number(ledger.withdrawal || 0)
        }));

        const exportedTransactions = transactions.map(transaction => ({
            date: formatDate(transaction.date),
            user_email: transaction.User?.email || '',
            project_code: projectCodeById[transaction.ProjectId] || toProjectCode(transaction.Project?.name, transaction.ProjectId),
            amount: Number(transaction.amount || 0),
            type: transaction.type,
            narration: transaction.narration || '',
            status: transaction.status
        }));

        return {
            generatedAt: new Date().toISOString(),
            users: users.map(user => user.toJSON()),
            projects: exportedProjects,
            assignments: exportedAssignments,
            transactions: exportedTransactions
        };
    }

    async importData(payload, actorUser) {
        const users = Array.isArray(payload?.users) ? payload.users : [];
        const projects = Array.isArray(payload?.projects) ? payload.projects : [];
        const assignments = Array.isArray(payload?.assignments) ? payload.assignments : [];
        const sendEmails = payload?.sendEmails !== false;

        const normalizedUsers = users.map(normalizeUserRow);
        const normalizedProjects = projects.map(normalizeProjectRow);
        const normalizedAssignments = assignments.map(normalizeAssignmentRow);

        const validationErrors = [
            ...validateUnique(normalizedUsers.map(u => u.email), 'users.email'),
            ...validateUnique(normalizedProjects.map(p => p.projectCode), 'projects.project_code'),
            ...collectRowValidationErrors(normalizedUsers, 'users'),
            ...collectRowValidationErrors(normalizedProjects, 'projects'),
            ...collectRowValidationErrors(normalizedAssignments, 'assignments')
        ];

        if (validationErrors.length) {
            const err = new Error('Migration validation failed');
            err.code = 'MIGRATION_VALIDATION';
            err.details = validationErrors;
            throw err;
        }

        const transaction = await User.sequelize.transaction();
        const report = {
            usersCreated: 0,
            usersUpdated: 0,
            projectsCreated: 0,
            projectsUpdated: 0,
            assignmentsCreated: 0,
            assignmentsUpdated: 0
        };

        const credentials = [];
        const userByEmail = new Map();
        const projectByCode = new Map();

        try {
            for (const row of normalizedUsers) {
                const existingUser = await User.scope('withHash').findOne({
                    where: { email: row.email },
                    transaction
                });

                if (existingUser) {
                    existingUser.name = row.name;
                    existingUser.phoneNumber = row.phoneNumber;
                    existingUser.address = row.address;
                    existingUser.country = row.country;
                    existingUser.role = row.role;
                    existingUser.status = row.status;
                    await existingUser.save({ transaction });

                    userByEmail.set(row.email, existingUser);
                    report.usersUpdated += 1;
                    continue;
                }

                const temporaryPassword = generateTemporaryPassword();
                const createdUser = await User.create({
                    email: row.email,
                    name: row.name,
                    phoneNumber: row.phoneNumber,
                    address: row.address,
                    country: row.country,
                    role: row.role,
                    status: row.status,
                    password: await hash(temporaryPassword)
                }, { transaction });

                await UserSecurity.create({
                    UserId: createdUser.id,
                    mustChangePassword: true
                }, { transaction });

                credentials.push({
                    email: createdUser.email,
                    name: createdUser.name,
                    temporaryPassword
                });

                userByEmail.set(row.email, createdUser);
                report.usersCreated += 1;
            }

            for (const row of normalizedProjects) {
                const existingProject = await Project.findOne({
                    where: { name: row.name },
                    transaction
                });

                if (existingProject) {
                    existingProject.totalInvestement = row.totalInvestement;
                    existingProject.minROI = row.minROI;
                    existingProject.maxROI = row.maxROI;
                    existingProject.description = row.description;
                    existingProject.isActive = row.isActive;
                    await existingProject.save({ transaction });

                    projectByCode.set(row.projectCode, existingProject);
                    report.projectsUpdated += 1;
                    continue;
                }

                const createdProject = await Project.create({
                    name: row.name,
                    totalInvestement: row.totalInvestement,
                    minROI: row.minROI,
                    maxROI: row.maxROI,
                    description: row.description,
                    isActive: row.isActive,
                    UserId: actorUser?.id || null
                }, { transaction });

                projectByCode.set(row.projectCode, createdProject);
                report.projectsCreated += 1;
            }

            for (const row of normalizedAssignments) {
                let user = userByEmail.get(row.userEmail);
                if (!user) {
                    user = await User.findOne({
                        where: { email: row.userEmail },
                        transaction
                    });
                    if (user) userByEmail.set(row.userEmail, user);
                }

                if (!user) {
                    throwMigrationValidation(`Assignment user not found for email: ${row.userEmail}`, row._rowNumber, 'assignments');
                }

                let project = projectByCode.get(row.projectCode);
                if (!project) {
                    project = await this.resolveProjectByCode(row.projectCode, transaction);
                    if (project) projectByCode.set(row.projectCode, project);
                }

                if (!project) {
                    throwMigrationValidation(`Assignment project not found for project_code: ${row.projectCode}`, row._rowNumber, 'assignments');
                }

                const existingAssignment = await UserLedger.findOne({
                    where: {
                        UserId: user.id,
                        ProjectId: project.id
                    },
                    transaction
                });

                if (existingAssignment) {
                    existingAssignment.roi = row.roi;
                    existingAssignment.returnPeriod = row.returnPeriod;
                    existingAssignment.investment = row.investment;
                    existingAssignment.returns = row.returns;
                    existingAssignment.withdrawal = row.withdrawal;
                    await existingAssignment.save({ transaction });
                    report.assignmentsUpdated += 1;
                } else {
                    await UserLedger.create({
                        UserId: user.id,
                        ProjectId: project.id,
                        roi: row.roi,
                        returnPeriod: row.returnPeriod,
                        investment: row.investment,
                        returns: row.returns,
                        withdrawal: row.withdrawal
                    }, { transaction });
                    report.assignmentsCreated += 1;
                }
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }

        const emailFailures = [];
        let emailsSent = 0;
        if (sendEmails && credentials.length > 0) {
            for (const credential of credentials) {
                try {
                    if (!zeptoMailService.isConfigured()) {
                        throw new Error('ZeptoMail configuration is missing');
                    }

                    await zeptoMailService.sendTemporaryPasswordEmail({
                        toEmail: credential.email,
                        toName: credential.name,
                        temporaryPassword: credential.temporaryPassword,
                        loginUrl: process.env.MIGRATION_LOGIN_URL || 'http://localhost:3001/login'
                    });
                    emailsSent += 1;
                } catch (err) {
                    emailFailures.push({
                        email: credential.email,
                        message: err.message || 'Failed to send email'
                    });
                }
            }
        }

        return {
            message: 'Migration import completed successfully',
            summary: {
                ...report,
                generatedCredentials: credentials.length,
                emailsSent,
                emailFailures: emailFailures.length
            },
            generatedCredentials: credentials,
            credentialsCsv: buildCredentialsCsv(credentials),
            emailFailures
        };
    }

    async resolveProjectByCode(projectCode, transaction) {
        const match = String(projectCode || '').match(/-(\d+)$/);
        if (!match) return null;

        const id = Number(match[1]);
        if (!Number.isFinite(id)) return null;
        return await Project.findByPk(id, { transaction });
    }
}

module.exports = new MigrationService();

function normalizeUserRow(row = {}, index = 0) {
    const email = String(row.email || '').trim().toLowerCase();
    const roleValue = String(row.role || Role.User).trim().toLowerCase();
    const statusValue = String(row.status || 'verified').trim().toLowerCase();
    const role = ALLOWED_USER_ROLES.has(roleValue) ? roleValue : Role.User;
    const status = ALLOWED_USER_STATUSES.has(statusValue) ? statusValue : 'verified';

    const errors = [];
    if (!email) errors.push('email is required');
    if (!row.name || !String(row.name).trim()) errors.push('name is required');

    return {
        _rowNumber: index + 2,
        _errors: errors,
        email,
        name: String(row.name || '').trim(),
        phoneNumber: nullableString(row.phoneNumber),
        address: nullableString(row.address),
        country: nullableString(row.country),
        role,
        status
    };
}

function normalizeProjectRow(row = {}, index = 0) {
    const name = String(row.name || '').trim();
    const projectCode = String(row.project_code || row.projectCode || toProjectCode(name, index + 1)).trim().toUpperCase();
    const totalInvestement = Number(row.totalInvestement);
    const minROI = Number(row.minROI);
    const maxROI = Number(row.maxROI);
    const description = String(row.description || '').trim();
    const isActive = toBoolean(row.isActive);

    const errors = [];
    if (!projectCode) errors.push('project_code is required');
    if (!name) errors.push('name is required');
    if (!Number.isFinite(totalInvestement)) errors.push('totalInvestement must be a number');
    if (!Number.isFinite(minROI)) errors.push('minROI must be a number');
    if (!Number.isFinite(maxROI)) errors.push('maxROI must be a number');
    if (Number.isFinite(minROI) && Number.isFinite(maxROI) && minROI > maxROI) {
        errors.push('minROI cannot be greater than maxROI');
    }
    if (!description) errors.push('description is required');

    return {
        _rowNumber: index + 2,
        _errors: errors,
        projectCode,
        name,
        totalInvestement,
        minROI,
        maxROI,
        description,
        isActive
    };
}

function normalizeAssignmentRow(row = {}, index = 0) {
    const userEmail = String(row.user_email || row.userEmail || '').trim().toLowerCase();
    const projectCode = String(row.project_code || row.projectCode || '').trim().toUpperCase();
    const roi = Number(row.roi);
    const investment = row.investment === '' || row.investment === null || typeof row.investment === 'undefined'
        ? 0
        : Number(row.investment);
    const returns = row.returns === '' || row.returns === null || typeof row.returns === 'undefined'
        ? 0
        : Number(row.returns);
    const withdrawal = row.withdrawal === '' || row.withdrawal === null || typeof row.withdrawal === 'undefined'
        ? 0
        : Number(row.withdrawal);
    const returnPeriod = String(row.returnPeriod || '').trim().toLowerCase();
    const errors = [];

    if (!userEmail) errors.push('user_email is required');
    if (!projectCode) errors.push('project_code is required');
    if (!Number.isFinite(roi)) errors.push('roi must be a number');
    if (!Number.isFinite(investment)) errors.push('investment must be a number');
    if (!Number.isFinite(returns)) errors.push('returns must be a number');
    if (!Number.isFinite(withdrawal)) errors.push('withdrawal must be a number');
    if (Number.isFinite(investment) && investment < 0) errors.push('investment cannot be negative');
    if (Number.isFinite(returns) && returns < 0) errors.push('returns cannot be negative');
    if (Number.isFinite(withdrawal) && withdrawal < 0) errors.push('withdrawal cannot be negative');
    if (!ALLOWED_RETURN_PERIODS.has(returnPeriod)) {
        errors.push('returnPeriod must be one of: annual, semi-annual, quarterly, testing');
    }

    return {
        _rowNumber: index + 2,
        _errors: errors,
        userEmail,
        projectCode,
        roi,
        investment,
        returns,
        withdrawal,
        returnPeriod
    };
}

function validateUnique(values, fieldName) {
    const seen = new Set();
    const duplicates = [];
    for (const value of values) {
        if (!value) continue;
        if (seen.has(value)) {
            duplicates.push(`${fieldName} has duplicate value: ${value}`);
            continue;
        }
        seen.add(value);
    }
    return duplicates;
}

function collectRowValidationErrors(rows, sheetName) {
    const errors = [];
    for (const row of rows) {
        for (const entry of row._errors || []) {
            errors.push(`${sheetName} row ${row._rowNumber}: ${entry}`);
        }
    }
    return errors;
}

function toProjectCode(name, suffix) {
    const base = String(name || 'project')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 32) || 'PROJECT';

    return `${base}-${suffix}`;
}

function toBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function nullableString(value) {
    const normalized = String(value || '').trim();
    return normalized || null;
}

function generateTemporaryPassword(length = 12) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const bytes = crypto.randomBytes(length);
    let out = '';

    for (let i = 0; i < length; i += 1) {
        out += chars[bytes[i] % chars.length];
    }

    return out;
}

async function hash(password) {
    return await bcrypt.hash(password, 10);
}

function buildCredentialsCsv(credentials = []) {
    const header = 'email,temp_password';
    const lines = credentials.map(item => `${escapeCsv(item.email)},${escapeCsv(item.temporaryPassword)}`);
    return [header, ...lines].join('\n');
}

function escapeCsv(value) {
    const str = String(value || '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
}

function throwMigrationValidation(message, row, sheet) {
    const err = new Error('Migration validation failed');
    err.code = 'MIGRATION_VALIDATION';
    err.details = [`${sheet} row ${row}: ${message}`];
    throw err;
}
