export const DB_NAME = "basecamp"

export const UserRolesEnum = {
     ADMIN:"admin",
     PROJECT_ADMIN:"peoject_admin",
     MEMBER:"member"
}

export const AvailableUserRoles = Object.values(UserRolesEnum)


export const TaskStatusEnum = {
    PENDING:"pending",
    IN_PROGRESS:"in-progress",
    COMPLETED:"completed"
}

export const AvailableTaskStatus = Object.values(UserRolesEnum)