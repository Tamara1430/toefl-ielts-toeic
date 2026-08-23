import { notFound } from "next/navigation";
import { ExamType } from "@/lib/examConfig";
import ExamPractice from "./ExamPractice";

const VALID_EXAMS: ExamType[] = ["toefl", "ielts", "toeic"];

export function generateStaticParams() {
  return VALID_EXAMS.map((exam) => ({ exam }));
}

export default async function ExamPage({
  params,
}: {
  params: Promise<{ exam: string }>;
}) {
  const { exam } = await params;

  if (!VALID_EXAMS.includes(exam as ExamType)) {
    notFound();
  }

  return <ExamPractice exam={exam as ExamType} />;
}
