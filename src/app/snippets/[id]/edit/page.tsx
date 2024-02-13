import { notFound } from "next/navigation";
import { db } from "@/db";

import SnippetEditForm from "@/components/snippet-edit-form";
import Link from "next/link";

interface SnippetEditPageProps {
  params: {
    id: string;
  };
}

export default async function SnippetEditPage(props: SnippetEditPageProps) {
  const id = parseInt(props.params.id);

  const snippet = await db.snippet.findFirst({
    where: { id },
  });

  if (!snippet) {
    return notFound();
  }

  return (
    <div>
      <div className="flex my-2 justify-between items-center">
        <h1 className="text-xl font-bold"> {snippet.title}</h1>
        <div className="flex gap-4">
          <Link href={`/`} className="p-2 border rounded">
            Home
          </Link>
        </div>
      </div>
      <SnippetEditForm snippet={snippet} id={id}/>
    </div>
  );
}
