import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return [];
}

export default async function CharacterByIdPage({ params }: Props) {
  await params;
  redirect("/characters");
}
