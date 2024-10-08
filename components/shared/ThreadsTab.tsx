import { fetchUserPost } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import ThreadCard from "../cards/ThreadCard";
import { fetchCommunityPosts } from "@/lib/actions/community.actions";

interface Props {
    currentUserId: string,
    accountId: string,
    accountType: string
}

const ThreadsTab = async ({ currentUserId, accountId, accountType }: Props) => {
    let result: any
    if (accountType === 'Community') {
        result = await fetchCommunityPosts(accountId)
    } else {
        result = await fetchUserPost(accountId);
    }
    if (!result) redirect('/')

    return (
        <section className="mt-9 flex flex-col gap-10">
            {result.threads.map((thread: any) => (
                <ThreadCard
                    key={thread._id}
                    id={thread._id}
                    currentUserId={currentUserId}
                    parentId={thread.parentId}
                    content={thread.text}
                    // if the acc is user then get the name, img, id from result else get it from thread author 
                    author={accountType === 'User' ?
                        { name: result.name, image: result.image, id: result.id } :
                        { name: thread.author.name, image: thread.author.image, id: thread.author.id }}
                    community={accountType === "Community"
                        ? { name: result.name, id: result.id, image: result.image }
                        : thread.community}
                    createdAt={thread.createdAt}
                    comments={thread.children} />
            ))}
        </section>
    )
}

export default ThreadsTab;