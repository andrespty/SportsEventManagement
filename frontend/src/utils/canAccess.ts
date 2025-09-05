import { User } from "../types/models";
import { AccessOptions } from "../types/auth";

export const canAccess = (user: User | null, options: AccessOptions): boolean => {
    if (!user) return false
    if (options.owner && user.isOwner) return true;
    if (options.roles && options.roles.includes(user.role)) return true;
    return false;
};