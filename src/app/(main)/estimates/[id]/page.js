import { notFound } from "next/navigation";
import { getEstimateByIdAction, getProjectsAction, getTemplatesAction } from "../actions";
import EstimateDetailClient from "./EstimateDetailClient";

export const dynamic = 'force-dynamic';

export default async function EstimateDetailPage({ params, searchParams }) {
    // Await params for Next.js 15+ compatibility
    const { id } = await params;
    const { edit } = await searchParams;

    // Fetch Estimate, Projects, and Templates in parallel
    const [estimate, projects, templates] = await Promise.all([
        getEstimateByIdAction(id),
        getProjectsAction(),
        getTemplatesAction()
    ]);

    if (!estimate) {
        notFound();
    }

    // Determine initial mode
    const isEditing = edit === 'true';

    return (
        <div className="animate-in fade-in duration-500">
            <EstimateDetailClient
                estimate={estimate}
                projects={projects?.data || []} // Note: getProjectsAction returns { data, totalCount }
                templates={templates || []}
                initialIsEditing={isEditing}
            />
        </div>
    );
}