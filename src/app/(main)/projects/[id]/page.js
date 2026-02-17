import { getProjectByIdAction } from "../actions";
import ProjectClient from "./ProjectClient";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }) {
    const { id } = await params;
    const data = await getProjectByIdAction(id);

    if (!data) {
        return notFound();
    }

    return <ProjectClient data={data} />;
}