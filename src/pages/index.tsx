import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { type FormEvent, useState } from "react";
import { api } from "../utils/api";

const Home = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <main className="flex flex-col items-center pt-4">Loading...</main>;
  }

  return (
    <main className="flex flex-col items-center">
      <h1 className="pt-4 text-3xl">Fullstack POC</h1>
      <p>Stack: Next, tRPC, Prisma, NextAuth, Tailwind</p>
      <div className="pt-10">
        <div>
          {session ? (
            <>
              <p className="mb-4 text-center">Hi {session.user?.name}</p>
              <Image
                src={session.user?.image as string}
                alt={session.user?.name as string}
                width={100}
                height={100}
                className="mx-auto my-3 rounded-full object-cover"
              />
              <button
                type="button"
                className="mx-auto block rounded-md bg-neutral-800 py-3 px-6 text-center hover:bg-neutral-700"
                onClick={() => {
                  signOut().catch(console.log);
                }}
              >
                Logout
              </button>
              <div className="pt-6">
                <EntriesForm />
              </div>
            </>
          ) : (
            <button
              type="button"
              className="mx-auto block rounded-md bg-neutral-800 py-3 px-6 text-center hover:bg-neutral-700"
              onClick={() => {
                signIn("discord").catch(console.log);
              }}
            >
              Login with Discord
            </button>
          )}
          <div className="mt-10">
            <GuestbookEntries />
          </div>
        </div>
      </div>
    </main>
  );
};

const EntriesForm = () => {
  const apiUtil = api.useContext();

  const [message, setMessage] = useState("");
  const { mutateAsync } = api.guestbook.postMessage.useMutation({
    onMutate: async (newEntry) => {
      await apiUtil.guestbook.getAll.cancel();
      apiUtil.guestbook.getAll.setData(undefined, (prevEntries) => {
        if (prevEntries) {
          return [...prevEntries, newEntry];
        } else {
          return [newEntry];
        }
      });
    },
    onSettled: async () => {
      await apiUtil.guestbook.invalidate();
    },
    onError: () => {
      apiUtil.guestbook.getAll.getData(undefined);
    },
  });

  const session = useSession();

  if (session.status !== "authenticated") return null;
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    mutateAsync({
      name: session.data?.user?.name as string,
      message,
    }).finally(() => {
      setMessage("");
    });
  }

  return (
    <form className="flex gap-2" onSubmit={handleSubmit}>
      <input
        type="text"
        className="rounded-md border-2 border-zinc-800 bg-neutral-900 px-4 py-2 focus:outline-none"
        placeholder="Message"
        min="33"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        type="submit"
        className="rounded-md border-2 border-zinc-800 p-2 focus:outline-none"
      >
        Submit
      </button>
    </form>
  );
};

const GuestbookEntries = () => {
  const { data: guestbookEntries, isLoading } = api.guestbook.getAll.useQuery();

  if (isLoading) return <>Fetching messages..</>;

  return (
    <div className="flex flex-col gap-4">
      {guestbookEntries?.map((entry, index) => (
        <div key={index}>
          <p>{entry.message}</p>
          <span> {entry.name} </span>
        </div>
      ))}
    </div>
  );
};
export default Home;
