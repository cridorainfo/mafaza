const userService = require('../Services/user.service');
const projectService = require('../Services/project.service');
const transactionService = require('../Services/transaction.service');
const userLedgerService = require('../Services/user-ledger.service');

class DashboardController {

    async getStats(req, res, next) {
        try {
            const isAdmin = req.user.role === "admin"
            const countProjects = isAdmin ? projectService.countAll : userLedgerService.countAssigned
            const UserId = req.user.id
            const [ verifiedUsers, pendingUsers, totalProjects, totalInvestments, totalWithdrawals, totalReturns, avgRoi ] = await Promise.all([
                userService.countByStatus("verified"),
                userService.countByStatus("pending"),
                countProjects(UserId),
                userLedgerService.totalField("investment", !isAdmin ? UserId : false),
                userLedgerService.totalField("withdrawal", !isAdmin ? UserId : false),
                userLedgerService.totalField("returns", !isAdmin ? UserId : false),
                userLedgerService.avgRoi(!isAdmin ? UserId : false)
            ])
    
            return res.json({
                verifiedUsers, pendingUsers, totalProjects,
                totalReturns, totalInvestments, totalWithdrawals,
                cashCirculation: 0, avgRoi
            })
        } catch (error) {
            next(error)
        }
    }

    async getNextPayments(req, res, next) {
        try {
            if (req.user.role === "admin") return res.json([]);

            const schedule = await userLedgerService.getNextPaymentSchedule(req.user.id);
            return res.json(schedule);
        } catch (error) {
            next(error);
        }
    }
}
module.exports = new DashboardController();
