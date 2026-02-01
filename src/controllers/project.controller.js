import { Project } from '../models/project.modal.js'
import { ProjectMember } from '../models/project-member.modal.js'
import { ApiError } from '../utils/api_error.js'
import { ApiResponse } from '../utils/api_response.js'
import { UserRolesEnum, AvailableUserRoles } from '../utils/constants.js'
import { User } from '../models/user.modal.js'
import mongoose from 'mongoose'

//   create a proejct
const createProject = async (req, res) => {
    try {
        const { name, decription } = req.body
        const project = await Project.create({
            name,
            decription,
            createdBy: new mongoose.Types.ObjectId(req.user._id),
        })

        await ProjectMember.create({
            user: new mongoose.Types.ObjectId(req.user._id),
            project: new mongoose.Types.ObjectId(project._id),
            role: UserRolesEnum.ADMIN,
        })

        return res
            .status(200)
            .json(new ApiResponse(200, project, 'project created successfully'))
    } catch (error) {
        throw new ApiError(
            500,
            { error },
            'error in create project api controller'
        )
    }
}

// update a project
const updateProject = async (req, res) => {
    try {
        const { name, description } = req.body
        const { projectId } = req.params

        const project = await Project.findByIdAndUpdate(
            projectId,
            {
                name,
                description,
            },
            { new: true }
        )

        if (!project) {
            throw new ApiError(404, {}, 'project id is not valid')
        }

        return res
            .status(200)
            .json(new ApiResponse(200, project, 'project updated successfully'))
    } catch (error) {
        throw new ApiError(
            500,
            { error },
            'error in update project api controller'
        )
    }
}

// delete a project
const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.user
        const project = await Project.findByIdAndDelete(projectId)
        if (!project) {
            throw new ApiError(404, {}, 'no project found with this id')
        }
        return res
            .status(200)
            .json(new ApiResponse(200, project, 'project updated successfully'))
    } catch (error) {
        throw new ApiError(
            500,
            { error },
            'error in delete project api controller'
        )
    }
}

export { createProject, updateProject, deleteProject }
