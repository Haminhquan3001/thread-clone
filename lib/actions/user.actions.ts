"use server"

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose"
import Thread from "../models/thread.model";
import { FilterQuery, SortOrder } from "mongoose";
import mongoose from "mongoose";
import Community from "../models/community.model";

interface Params {
    userId: string,
    username: string,
    bio: string,
    name: string,
    image: string,
    path: string
}
export async function updateUser({
    userId,
    username,
    name,
    image,
    bio,
    path }: Params
): Promise<void> {

    await connectToDB();
    try {
        await User.findOneAndUpdate({ id: userId },
            {
                username: username.toLowerCase().trim(),
                name,
                bio,
                path,
                image,
                onboarded: true

            }, {
            upsert: true //update if db exist, otherwise insert
        });
        if (path === 'profile/edit') {
            revalidatePath(path);
        }
    } catch (error: any) {
        throw new Error(`Fail to create/update user: ${error.message}`)
    }

}

export async function fetchUser(userId: string) {
    try {
        await connectToDB();
        return await User.findOne({ id: userId })
            .populate({
                path: 'communities',
                model: Community
            });
    } catch (error: any) {
        throw new Error(`Failed to fetch user: ${error.message}`)
    }
}

export async function fetchUserPost(userId: string) {
    connectToDB();
    try {
        const threads = await User.findOne({ id: userId }).populate({
            path: 'threads',
            model: Thread,
            populate: [
                {
                    path: "community",
                    model: Community,
                    select: "name id image _id",
                },
                {
                    path: 'children',
                    model: Thread,
                    populate: {
                        path: 'author',
                        model: User,
                        select: 'name image id'
                    }
                }]
        })

        return threads
    } catch (error: any) {
        throw new Error(`error fetching user post: ${error.message}`)
    }
}

export async function fetchUsers({
    userId,
    searchString = "",
    pageNumber = 1,
    pageSize = 20,
    sortBy = "desc",
}: {
    userId: string
    searchString?: string,
    pageNumber?: number,
    pageSize?: number,
    sortBy?: SortOrder
}) {
    try {
        connectToDB();
        const skipAmt = (pageNumber - 1) * pageSize;
        const regex = new RegExp(searchString, "i");

        const query: FilterQuery<typeof User> = {
            id: { $ne: userId }
        }
        if (searchString.trim() !== '') {
            query.$or = [
                { username: { $regex: regex } },
                { name: { $regex: regex } }
            ]
        }

        const sortOptions = { createdAt: sortBy };
        const usersQuery =
            User.find(query)
                .sort(sortOptions)
                .skip(skipAmt)
                .limit(pageSize)

        const totalUsersCount = await User.countDocuments(query);
        const users = await usersQuery.exec()

        const isNext = totalUsersCount > skipAmt + users.length;
        return { users, isNext };

    } catch (error: any) {
        throw new Error(`error fetch users ${error.message}`)
    }
}

export async function getActivities(userId: string) {
    try {
        connectToDB();
        //Find all threads created by users


        const user = await User.findOne({ id: userId });
        if (!user) {
            throw new Error("Cannot get activities for user because user not found")
        }

        const userThreads = await Thread.find({ author: user._id });
        //Collect all the child threadId (comments) from the children
        const childThreadsIds = userThreads.reduce((acc, userThread) => {
            return acc.concat(userThread.children)
        }, [])
        //Get the access from all the replies that is not from the user
        // In thread, find all replies 
        // (with ids from array of comments we retrieve above)
        // and filter out among those replies the replies that is not from 
        // the curren user
        // and populate other commentors name, img, and id

        const replies = await Thread.find({
            _id: { $in: childThreadsIds },
            author: { $ne: user._id }
        }).populate({
            path: 'author',
            model: User,
            select: "name image _id"
        })

        return replies;

    } catch (error: any) {
        throw new Error(`error getting activities: ${error.message}`)
    }
}