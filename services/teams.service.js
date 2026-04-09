import connectMongoDB from '../libs/mongoose.js';
import Team from '../models/Team.js';
import User from '../models/User.js';

export default class TeamsService {
    constructor() {
        connectMongoDB();
    }

    getAll = async (req) => {
        try {
            const companyId = req.companyId;
            if (!companyId) return { success: false, message: 'Company context required' };
            const data = await Team.find({ companyId }).lean();
            return {
                success: true,
                message: 'Teams retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving teams' };
        }
    };

    getById = async (req) => {
        try {
            const { id } = req.params;
            const companyId = req.companyId;
            if (!companyId) return { success: false, message: 'Company context required' };
            const data = await Team.findOne({ _id: id, companyId }).lean();
            if (!data) return { success: false, message: 'Team not found' };
            return { success: true, message: 'Team retrieved successfully', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving team' };
        }
    };

    create = async (req) => {
        try {
            const companyId = req.companyId;
            if (!companyId) return { success: false, message: 'Company context required' };
            const data = await Team.create({ ...req.body, companyId });
            return { success: true, message: 'Team created successfully', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error creating team' };
        }
    };

    update = async (req) => {
        try {
            const { id } = req.params;
            const companyId = req.companyId;
            if (!companyId) return { success: false, message: 'Company context required' };
            const data = await Team.findOneAndUpdate(
                { _id: id, companyId },
                req.body,
                { new: true, lean: true }
            );
            if (!data) return { success: false, message: 'Team not found' };
            return { success: true, message: 'Team updated successfully', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error updating team' };
        }
    };

    delete = async (req) => {
        try {
            const { id } = req.params;
            const companyId = req.companyId;
            if (!companyId) return { success: false, message: 'Company context required' };
            const data = await Team.findOneAndDelete({ _id: id, companyId }).lean();
            if (!data) return { success: false, message: 'Team not found' };
            return { success: true, message: 'Team deleted successfully', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error deleting team' };
        }
    };

    getMembers = async (req) => {
        try {
            const { id } = req.params;
            const companyId = req.companyId;
            if (!companyId) return { success: false, message: 'Company context required' };
            if (req.user?.role === 'EXECUTIVE') {
                const myTeamId = req.user?.teamId ? String(req.user.teamId) : '';
                if (!myTeamId || String(id) !== myTeamId) {
                    return { success: false, message: 'Access denied: team context mismatch' };
                }
            }
            const team = await Team.findOne({ _id: id, companyId }).lean();
            if (!team) return { success: false, message: 'Team not found' };
            const data = await User.find({ teamId: String(id), companyId }).lean();
            return {
                success: true,
                message: 'Team members retrieved successfully',
                data,
            };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error retrieving team members' };
        }
    };
}
