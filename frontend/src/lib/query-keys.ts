export const queryKeys = {
    me: ["auth", "me"] as const,

    users: {
        all: ["users"] as const,
        list: (filters: object) =>
        ["users", "list", filters] as const,
        detail: (id: number) => ["users", "detail", id] as const,
        stats: (id: number) => ["users", "stats", id] as const,
    },

    projects: {
        all: ["projects"] as const,
        list: (filters: object) =>
        ["projects", "list", filters] as const,
        detail: (id: number) => ["projects", "detail", id] as const,
        members: (id: number) => ["projects", id, "members"] as const,
    },

    reports: {
        all: ["reports"] as const,
        mine: (filters: object) =>
        ["reports", "mine", filters] as const,
        team: (filters: object) =>
        ["reports", "team", filters] as const,
        detail: (id: number) => ["reports", "detail", id] as const,
        versions: (id: number) => ["reports", id, "versions"] as const,
        reviews: (id: number) => ["reports", id, "reviews"] as const,
    },

    dashboard: {
        me: ["dashboard", "me"] as const,
        team: (filters: object) =>
        ["dashboard", "team", filters] as const,
        tasksTrend: (filters: object) =>
        ["dashboard", "tasks-trend", filters] as const,
        workload: (filters: object) =>
        ["dashboard", "workload", filters] as const,
        hours: (filters: object) =>
        ["dashboard", "hours", filters] as const,
        activity: ["dashboard", "activity"] as const,
    },
} as const;
