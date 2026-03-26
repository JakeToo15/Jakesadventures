import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ kategorie: string }>;
};

export async function generateStaticParams() {
  return [];
}

export default async function KategoriePage({ params }: Props) {
  await params;
  redirect("/regelwerk");
}
