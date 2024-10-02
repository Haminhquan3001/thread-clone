"use server"
import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose"

interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string
}

export async function createThread({ text, author, communityId, path }: Params) {

    try {
        await connectToDB();
        const createThread = await Thread.create({ text, author, community: null, });
        await User.findByIdAndUpdate(author,
            { $push: { threads: createThread._id } }
        );
        revalidatePath(path)
    } catch (error: any) {
        throw new Error(`fail to create a Thread ${error.message}`)
    }
}

export async function fetchPost(pageNumber = 1, pageSize = 20) {
    try {
        await connectToDB();
        const skipAmt = (pageNumber - 1) * pageSize;
        // fetch the most recent top-level threads

        // - BUILD a Query to documents
        /*
        - Select top-level thread order by desc, 
        - within those top-level threads, populate
        - author info from user table
        - and populate all comments info within a specific thread
        */

        const postQuery = Thread.find({ parentId: { $in: [null, undefined] } })
            .sort({ createdAt: 'desc' })
            .skip(skipAmt).limit(pageSize)
            .populate({ path: 'author', model: User })
            .populate({
                path: 'children',
                populate: {
                    path: 'author',
                    model: User,
                    select: "_id name parentId image"
                }
            })
        const totalPostsCount = await Thread.countDocuments({ parentId: { $in: [null, undefined] } })
        //execute the query
        const posts = await postQuery.exec();
        const postData = JSON.parse(JSON.stringify(posts))
        const isNext = totalPostsCount > skipAmt + posts.length;
        return { posts, isNext }
    } catch (error: any) {
        throw new Error(`fail to fetch posts ${error.message}`)
    }
}

export async function fetchThreadById(id: string) {
    connectToDB();
    try {

        // fetch the info about a specific thread

        // - BUILD a Query to documents
        /*
        - Select thread by id, 
        - within this thread, populate
        - author info from user table
        - and populate an array of comments info 
        - i.e. commentor info, the reply itself(which is a thread) 
        - within that reply, populate
        - details about commentor
        */

        const threadQuery = Thread.findById(id).populate({
            path: 'author',
            model: User,
            select: "_id id name image"
        }).populate({
            path: 'children',
            populate: [
                {
                    path: 'author',
                    model: User,
                    select: "_id id name parentId image"
                },
                {
                    path: 'children',
                    model: Thread,
                    populate: {
                        path: 'author',
                        model: User,
                        select: "_id id name image parentId"
                    }

                }]
        })
        const thread = await threadQuery.exec();
        return thread;
    } catch (error: any) {
        throw new Error(`Fail to fetch thread by id with error ${error.message}`)
    }
}

export async function addCommentToThread(
    threadId: string,
    commentText: string,
    userId: string,
    path: string
) {
    connectToDB();
    try {
        //find the original thread by its id
        console.log("threadId: ", threadId)
        const originalThread = await Thread.findById(threadId);
        if (!originalThread) {
            throw new Error('Thread not found')
        }
        //Create a new thread with comment text
        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId,

        })

        //save the new thread to db
        const savedCommentThread = await commentThread.save();

        //Update the original thread to include the new comment
        originalThread.children.push(savedCommentThread._id);
        //Save the original thread
        await originalThread.save();

        revalidatePath(path);

    } catch (error: any) {
        throw new Error(`error adding comment to thread: ${error.message}`);
    }
}
