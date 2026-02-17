"use client";

import { useState } from "react";
import ProjectDetails from "./ProjectDetails";
import ProjectTimeEntries from "./ProjectTimeEntries";
import ProjectEstimates from "./ProjectEstimates";
import ProjectContacts from "./ProjectContacts";

export default function ProjectTabs({ project }) {
    const [activeTab, setActiveTab] = useState("details");

    const tabs = [
        { id: "details", label: "Details" },
        { id: "time", label: "Time Entries" },
        { id: "estimates", label: "Estimates" },
        { id: "contacts", label: "Contacts" },
    ];

    return (
        <div>
            {/* Tab Header */}
            <div className="flex items-center gap-1 border-b border-stone-200 dark:border-stone-800 mb-6 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? "border-amber-600 text-amber-600"
                                : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === "details" && <ProjectDetails project={project} />}
                {activeTab === "time" && <ProjectTimeEntries projectId={project.internalid} />}
                {activeTab === "estimates" && <ProjectEstimates projectId={project.internalid} />}
                {activeTab === "contacts" && <ProjectContacts />}
            </div>
        </div>
    );
}
