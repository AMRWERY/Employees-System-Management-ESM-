export interface Rating {
  [key: string]: number;
  communication: number;
  productivity: number;
  teamwork: number;
  problem_solving: number;
}

export interface PerformanceReview {
  id?: string;
  employee_id: string;
  employee_name?: string;
  review_period: string;
  reviewer_id: string;
  ratings: Rating;
  comments: string;
  strengths: string;
  improvements: string;
  overall_score: number;
  created_at: Date; // Changed to Date only
}

export interface Goal {
  id?: string;
  employee_id: string;
  title: string;
  description: string;
  target_date: Date; // Changed to Date only
  status: "Not Started" | "In Progress" | "Achieved" | "Abandoned";
  manager_notes?: string;
  created_at: Date; // Changed to Date only
  updated_at?: Date; // Changed to Date only
}

export interface KPI {
  id?: string;
  employee_id: string;
  name: string;
  target: number;
  actual: number;
  result: number;
  period: string;
  created_at: Date; // Changed to Date only
}

export interface Feedback {
  id?: string;
  employee_id: string;
  reviewer_id: string;
  comment: string;
  visibility: "public" | "private";
  sentiment: "positive" | "neutral" | "negative";
  created_at: Date; // Changed to Date only
}

export interface SelfEvaluation {
  id?: string;
  employee_id: string;
  review_period: string;
  ratings: Rating;
  comments: string;
  created_at: Date; // Changed to Date only
}

export interface PerformanceTag {
  employee_id: string;
  tag: "Top Performer" | "Needs Improvement" | "Exceeded Expectations";
  applied_by: string;
  applied_at: Date; // Changed to Date only
  reason?: string;
}

export interface EmployeesPerformanceState {
  performanceReviews: PerformanceReview[];
  goals: Goal[];
  kpis: KPI[];
  feedback: Feedback[];
  selfEvaluations: SelfEvaluation[];
  performanceTags: PerformanceTag[];
  searchTerm: string;
  currentPage: number;
  itemsPerPage?: number;
  isLoading: boolean;
  error: string | null;
  filterByPeriod?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface RatingStstus {
  status:
    | "Top Performer"
    | "Needs Improvement"
    | "Exceeded Expectations"
    | "All";
}