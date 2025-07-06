import type { DocumentData } from "firebase/firestore";
import {
  addDoc,
  updateDoc,
  doc,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase";
import type {
  EmployeesPerformanceState,
  PerformanceReview,
  Goal,
  KPI,
  Feedback,
  SelfEvaluation,
  PerformanceTag,
} from "@/types/employees-performance";

// Utility function to convert Firestore Timestamps to Dates
const convertTimestamps = (data: any): any => {
  if (data && typeof data === "object") {
    Object.keys(data).forEach((key) => {
      // Convert Firestore Timestamps
      if (data[key] && typeof data[key] === "object" && "toDate" in data[key]) {
        data[key] = data[key].toDate();
      }
      // Recursively process nested objects
      else if (typeof data[key] === "object") {
        data[key] = convertTimestamps(data[key]);
      }
    });
  }
  return data;
};

// Conversion function for PerformanceReview
export const firestoreToPerformanceReview = (
  doc: DocumentData
): PerformanceReview => {
  const data = convertTimestamps(doc.data());
  return {
    id: doc.id,
    employee_id: data.employee_id,
    employee_name: data.employee_name,
    review_period: data.review_period,
    reviewer_id: data.reviewer_id,
    ratings: data.ratings,
    comments: data.comments,
    strengths: data.strengths,
    improvements: data.improvements,
    overall_score: data.overall_score,
    created_at: data.created_at,
  };
};

// Create similar conversion functions for other types:
export const firestoreToGoal = (doc: DocumentData): Goal => {
  const data = convertTimestamps(doc.data());
  return {
    id: doc.id,
    employee_id: data.employee_id,
    title: data.title,
    description: data.description,
    target_date: data.target_date,
    status: data.status,
    manager_notes: data.manager_notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

export const firestoreToKPI = (doc: DocumentData): KPI => {
  const data = convertTimestamps(doc.data());
  return {
    id: doc.id,
    employee_id: data.employee_id,
    name: data.name,
    target: data.target,
    actual: data.actual,
    result: data.result,
    period: data.period,
    created_at: data.created_at,
  };
};

export const firestoreToFeedback = (doc: DocumentData): Feedback => {
  const data = convertTimestamps(doc.data());
  return {
    id: doc.id,
    employee_id: data.employee_id,
    reviewer_id: data.reviewer_id,
    comment: data.comment,
    visibility: data.visibility,
    sentiment: data.sentiment,
    created_at: data.created_at,
  };
};

export const firestoreToSelfEvaluation = (
  doc: DocumentData
): SelfEvaluation => {
  const data = convertTimestamps(doc.data());
  return {
    id: doc.id,
    employee_id: data.employee_id,
    review_period: data.review_period,
    ratings: data.ratings,
    comments: data.comments,
    created_at: data.created_at,
  };
};

export const firestoreToPerformanceTag = (
  doc: DocumentData
): PerformanceTag => {
  const data = convertTimestamps(doc.data());
  return {
    employee_id: data.employee_id,
    tag: data.tag,
    applied_by: data.applied_by,
    applied_at: data.applied_at,
    reason: data.reason,
  };
};

export function getEmployeeRate(score: number): "weak" | "medium" | "strong" {
  if (score >= 80) return "strong";
  if (score >= 60) return "medium";
  return "weak";
}

export const useEmployeesPerformanceStore = defineStore(
  "employees-performance",
  {
    state: (): EmployeesPerformanceState => ({
      performanceReviews: [],
      goals: [],
      kpis: [],
      feedback: [],
      selfEvaluations: [],
      performanceTags: [],
      filterByPeriod: "",
      searchTerm: "",
      currentPage: 1,
      itemsPerPage: 10,
      isLoading: false,
      error: null,
    }),

    actions: {
      async fetchPerformanceReviews(employeeId?: string) {
        try {
          this.isLoading = true;
          const reviewsRef = collection(db, "ems-employees-performance");
          const querySnapshot = await getDocs(reviewsRef);

          this.performanceReviews = querySnapshot.docs.map(
            firestoreToPerformanceReview
          );
        } catch (err) {
          this.error = "Failed to load performance reviews";
          console.error("Fetch error:", err);
        } finally {
          this.isLoading = false;
        }
      },

      async addPerformanceReview(review: PerformanceReview) {
        try {
          this.isLoading = true;
          // Add to Firestore
          const docRef = await addDoc(
            collection(db, "ems-employees-performance"),
            review
          );
          // Add to local state
          this.performanceReviews.push({
            ...review,
            id: docRef.id,
          });
          return true;
        } catch (error) {
          this.error = "Failed to add performance review";
          console.error(error);
          return false;
        } finally {
          this.isLoading = false;
        }
      },

      async updatePerformanceReview(
        id: string,
        updates: Partial<PerformanceReview>
      ) {
        try {
          this.isLoading = true;
          // Update in Firestore
          await updateDoc(doc(db, "ems-employees-performance", id), updates);
          // Update local state
          const index = this.performanceReviews.findIndex((r) => r.id === id);
          if (index !== -1) {
            this.performanceReviews[index] = {
              ...this.performanceReviews[index],
              ...updates,
            };
          }
          return true;
        } catch (error) {
          this.error = "Failed to update performance review";
          console.error(error);
          return false;
        } finally {
          this.isLoading = false;
        }
      },

      // ... other actions remain the same ...

      // Automatic tag assignment based on performance
      async addPerformanceTag(tag: PerformanceTag) {
        // Implementation will go here
        // For now, just add to state
        this.performanceTags.push(tag);
      },

      // ... other actions ...

      // Automatic tag assignment based on performance
      async assignAutomaticTags(employeeId: string) {
        // Use 'this' to access store methods
        const reviews = this.performanceReviewsForEmployee(employeeId);
        if (reviews.length === 0) return;

        const latestReview = reviews[0];
        const overallScore = latestReview.overall_score;

        // Remove existing system-generated tags
        this.performanceTags = this.performanceTags.filter(
          (tag) => tag.employee_id !== employeeId || tag.applied_by !== "system"
        );

        // Add new tag based on score
        let newTag: PerformanceTag["tag"] | null = null;

        if (overallScore >= 90) {
          newTag = "Top Performer";
        } else if (overallScore >= 75) {
          newTag = "Exceeded Expectations";
        } else if (overallScore < 60) {
          newTag = "Needs Improvement";
        }

        if (newTag) {
          // Call the action using 'this'
          await this.addPerformanceTag({
            employee_id: employeeId,
            tag: newTag,
            applied_by: "system",
            applied_at: new Date(),
            reason: `Automatic assignment based on performance score: ${overallScore}`,
          });
        }
      },

      setSearchTerm(term: string) {
        this.searchTerm = term;
        this.currentPage = 1; // Reset to first page on new search
        //   this._applyFiltersAndPagination();
      },

      setCurrentPage(page: number) {
        if (page > 0 && page <= this.totalPages) {
          this.currentPage = page;
          // this._applyFiltersAndPagination();
        }
      },

      setItemsPerPage(limit: number) {
        this.itemsPerPage = limit;
        this.currentPage = 1;
        //   this._applyFiltersAndPagination();
      },
    },

    getters: {
      // Performance Reviews
      performanceReviewsForEmployee: (state) => (employeeId: string) => {
        return state.performanceReviews
          .filter((review) => review.employee_id === employeeId)
          .sort((a, b) => b.created_at.getTime() - a.created_at.getTime()); // Fixed date comparison
      },

      // Goals
      goalsForEmployee: (state) => (employeeId: string) => {
        return state.goals
          .filter((goal) => goal.employee_id === employeeId)
          .sort((a, b) => a.target_date.getTime() - b.target_date.getTime()); // Fixed date comparison
      },

      // ... other getters with fixed date comparisons ...

      // Performance Trends
      performanceTrends: (state) => (employeeId: string) => {
        const reviews = state.performanceReviews
          .filter((r) => r.employee_id === employeeId)
          .sort((a, b) => a.created_at.getTime() - b.created_at.getTime()); // Fixed date comparison

        return reviews.map((review) => ({
          period: review.review_period,
          score: review.overall_score,
          createdAt: review.created_at,
        }));
      },

      // Current performance tag
      currentPerformanceTag: (state) => (employeeId: string) => {
        const tags = state.performanceTags
          .filter((tag) => tag.employee_id === employeeId)
          .sort((a, b) => b.applied_at.getTime() - a.applied_at.getTime()); // Fixed date comparison

        return tags.length > 0 ? tags[0] : null;
      },

      totalPages: (state) => {
        const totalItems = state.performanceReviews.length;
        return Math.ceil(totalItems / (state.itemsPerPage ?? 10));
      },
    },
  }
);
