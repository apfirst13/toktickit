export interface Category {
  id: number;
  name: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

/**
 * Checks the backend system status by verifying the health endpoint and fetching categories.
 *
 * @returns A promise that resolves to the system status including online status and categories
 * @throws Error if either the health check or categories fetch fails
 */
// Issue 2 + Issue 4 — call the backend.
// Steps: fetch `${API_URL}/api/health`; if not ok, throw.
//        then fetch `${API_URL}/api/categories`; if not ok, throw.
//        return { online: true, categories }.
// Throwing on failure lets the UI show a single Offline/error state.
export async function checkSystem(): Promise<SystemStatus> {
  // TODO(Issue 2 & 4): implement the two fetch calls described above.
  throw new Error("checkSystem not implemented yet");
}
