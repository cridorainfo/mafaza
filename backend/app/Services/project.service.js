const { Project, ProjectImage, UserLedger, User } = require('../Models');
const { fn, col, Op } = require('sequelize');
const auditLogService = require('./audit-log.service');
const notificationService = require('./notification.service');
const ALLOWED_RETURN_PERIODS = new Set(['annual', 'semi-annual', 'quarterly', 'testing']);

class ProjectService {
  
    async getAll({ page = 1, perPage = 10, sort = 'DESC', sortColumn = 'createdAt', ...filters }) {
        page = parseInt(page)
        perPage = parseInt(perPage)

        const offset = (page - 1) * perPage;

        const whereClause = {};
        if(filters.q)
            whereClause.name = {
                [Op.like]: `%${filters.q}%`
            }
        const { count, rows } = await Project.findAndCountAll({
            where: whereClause,
            limit: perPage,
            offset: offset,
            order: [[sortColumn, sort]],
            include: [
                {
                    model: ProjectImage,
                    as: 'ProjectImages',
                    required: false
                },
                {
                    model: UserLedger,
                    as: 'ledgers',
                    required: false,
                    include: [
                        {
                            model: User,
                            required: false
                        }
                    ]
                }
            ]
        });

        return {
            totalRecords: count,
            totalPages: Math.ceil(count / perPage),
            currentPage: page,
            perPage,
            data: rows
        };
    }

    async update(id, params, actorUser, ipAddress, files = []) {
        const project = await this.getById(id);
        // copy params to user and save
        Object.assign(project, params);
        project.updated = Date.now();
        await project.save()

        const uploadedFiles = Array.isArray(files) ? files : [];
        if (uploadedFiles.length > 0) {
            await ProjectImage.destroy({
                where: {
                    ProjectId: project.id
                }
            });

            await ProjectImage.bulkCreate(uploadedFiles.map(file => ({
                link: `/uploads/${file.filename}`,
                ProjectId: project.id
            })));
        }

        if (actorUser?.role === "admin") {
            await auditLogService.log({
                actorUser,
                action: 'project_updated',
                description: `Updated project #${project.id} (${project.name})`,
                targetType: 'project',
                targetId: project.id,
                metadata: {
                    fields: Object.keys(params || {}),
                    isActive: project.isActive,
                    imageCount: uploadedFiles.length > 0 ? uploadedFiles.length : undefined
                },
                ipAddress
            });
        }

        return project;
    }

    async updateLedgerRoi(projectId, ledgerId, params = {}, actorUser, ipAddress) {
        const project = await Project.findByPk(projectId);
        if (!project) throw 'Project not found';

        const hasRoi = Object.prototype.hasOwnProperty.call(params || {}, 'roi');
        const hasReturnPeriod = Object.prototype.hasOwnProperty.call(params || {}, 'returnPeriod');
        if (!hasRoi && !hasReturnPeriod) {
            throw 'At least one of ROI or returnPeriod is required';
        }

        let parsedRoi = null;
        if (hasRoi) {
            parsedRoi = Number(params.roi);
            if (!Number.isFinite(parsedRoi)) throw 'ROI must be a valid number';
            if (parsedRoi < project.minROI || parsedRoi > project.maxROI) {
                throw `ROI must be between ${project.minROI} and ${project.maxROI}`;
            }
        }

        let normalizedReturnPeriod = null;
        if (hasReturnPeriod) {
            normalizedReturnPeriod = String(params.returnPeriod || '').trim().toLowerCase();
            if (!ALLOWED_RETURN_PERIODS.has(normalizedReturnPeriod)) {
                throw 'returnPeriod must be one of: annual, semi-annual, quarterly, testing';
            }
        }

        const ledger = await UserLedger.findOne({
            where: {
                id: ledgerId,
                ProjectId: projectId
            }
        });

        if (!ledger) throw 'User ledger not found for this project';

        const previousRoi = ledger.roi;
        const previousReturnPeriod = ledger.returnPeriod;

        if (hasRoi) ledger.roi = parsedRoi;
        if (hasReturnPeriod) ledger.returnPeriod = normalizedReturnPeriod;

        ledger.updated = Date.now();
        await ledger.save();

        const roiChanged = hasRoi && Number(previousRoi) !== Number(ledger.roi);
        const returnPeriodChanged =
            hasReturnPeriod && String(previousReturnPeriod || '') !== String(ledger.returnPeriod || '');

        if (roiChanged || returnPeriodChanged) {
            const changeBits = [];
            if (roiChanged) changeBits.push(`ROI: ${previousRoi}% -> ${ledger.roi}%`);
            if (returnPeriodChanged) changeBits.push(`Return Period: ${previousReturnPeriod} -> ${ledger.returnPeriod}`);

            await notificationService.safeCreateForUser(ledger.UserId, {
                title: 'Investment Terms Updated',
                message: `Your terms for ${project.name} were updated (${changeBits.join(', ')}).`,
                category: 'info',
                eventType: 'ledger_roi_updated',
                link: '/ledger',
                metadata: {
                    projectId: project.id,
                    projectName: project.name,
                    ledgerId: ledger.id,
                    previousRoi,
                    updatedRoi: ledger.roi,
                    previousReturnPeriod,
                    updatedReturnPeriod: ledger.returnPeriod
                }
            });
        }

        if (actorUser?.role === "admin") {
            const descriptionBits = [];
            if (roiChanged) descriptionBits.push(`ROI ${previousRoi} -> ${ledger.roi}`);
            if (returnPeriodChanged) descriptionBits.push(`Return Period ${previousReturnPeriod} -> ${ledger.returnPeriod}`);
            const changeDescription = descriptionBits.length > 0 ? descriptionBits.join(', ') : 'No value changes';

            await auditLogService.log({
                actorUser,
                action: 'ledger_roi_updated',
                description: `Updated terms for ledger #${ledger.id} in project #${project.id} (${changeDescription})`,
                targetType: 'ledger',
                targetId: ledger.id,
                metadata: {
                    projectId: project.id,
                    projectName: project.name,
                    UserId: ledger.UserId,
                    previousRoi,
                    updatedRoi: ledger.roi,
                    previousReturnPeriod,
                    updatedReturnPeriod: ledger.returnPeriod
                },
                ipAddress
            });
        }

        return ledger;
    }

    async getCarouselImages() {
        const projects = await Project.findAll({
            order: [['createdAt', 'DESC']],
            include: [{
                model: ProjectImage,
                as: 'ProjectImages',
                required: false,
                separate: true,
                limit: 1,
                order: [['createdAt', 'DESC']]
            }],
            limit: 10
        })
        return projects.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            image: p.ProjectImages?.[0]?.link || null
        }));
    }

    async create({ body, files, user, ip }) {
        if (!files || files.length === 0) throw "Please upload at least 1 image"
        const project = new Project(body);
        await project.save()

        await ProjectImage.bulkCreate(files.map(file => ({
            link: `/uploads/${file.filename}`,
            ProjectId: project.id 
        })));

        await notificationService.safeCreateForAllVerifiedUsers({
            title: 'New Project Added',
            message: `A new project "${project.name}" is now available on the platform.`,
            category: 'info',
            eventType: 'project_created',
            link: '/projects',
            metadata: {
                projectId: project.id,
                projectName: project.name
            }
        });

        if (user?.role === "admin") {
            await auditLogService.log({
                actorUser: user,
                action: 'project_created',
                description: `Created project #${project.id} (${project.name}) with ${files.length} image(s)`,
                targetType: 'project',
                targetId: project.id,
                metadata: {
                    imageCount: files.length,
                    isActive: project.isActive
                },
                ipAddress: ip
            });
        }

        return project;
    }

    async getById(id) {
        return await Project.findByPk(id, {
            include: [
                {
                    model: ProjectImage,
                    as: 'ProjectImages',
                    required: false
                },
                {
                    model: UserLedger,
                    as: 'ledgers',
                    required: false,
                    include: [
                        {
                            model: User,
                            required: false
                        }
                    ]
                }
            ]
        });
    }

    async countAll() {
        return await Project.count();
    }

    async avgRoi(){
        const result = await Project.findOne({
            attributes: [
                [fn('AVG', col('minROI')), 'averageROI']
            ],
            raw: true
        });
    
        return parseFloat(result.averageROI);
    }

    async delete(id) {
        const user = await getProject(id);
        await user.destroy();
    }
}

module.exports = new ProjectService();
