import * as z from 'zod';

export const UserValidation = z.object({
    profile_photo: z.string().url().min(1),
    name: z.string().min(2, { message: "Minimum 2 chars" }).max(30, { message: "Maximum 30 chars" }),
    username: z.string().min(3).max(30),
    bio: z.string().min(3).max(1000)
})