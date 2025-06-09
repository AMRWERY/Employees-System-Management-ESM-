import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  // For pagination with cursors if you choose that route later:
  // limit as firestoreLimit,
  // startAfter,
  // getCountFromServer,
} from "firebase/firestore";
import { db } from "@/firebase"; // Adjust path
import {
  type Payroll,
  type PayrollInputData,
  PayrollAllStatus,
  type PayrollState,
  type AppTimestamp,
  // type FetchPayrollParams, // We'll define params inline or specifically for the action
} from "@/types/payroll";

const PAYROLL_COLLECTION = "ems-payrolls";

function calculateNetSalary(data: {
  base_salary: number;
  working_days: number;
  days_present: number;
  overtime_hours: number;
  overtime_rate: number;
  bonuses: number;
  deductions: number;
  tax_percent: number;
}): number {
  if (data.working_days <= 0) return 0;
  if (data.days_present <= 0 && data.overtime_hours <= 0 && data.bonuses <= 0) {
    return -Math.abs(data.deductions);
  }
  const proratedBaseSalary =
    (data.base_salary / data.working_days) * data.days_present;
  const overtimePay = data.overtime_hours * data.overtime_rate;
  const grossEarnings = proratedBaseSalary + overtimePay + data.bonuses;
  const incomeAfterDeductions = grossEarnings - data.deductions;
  const taxAmount =
    incomeAfterDeductions > 0
      ? incomeAfterDeductions * (data.tax_percent / 100)
      : 0;
  const netSalary = incomeAfterDeductions - taxAmount;
  return parseFloat(netSalary.toFixed(2));
}

export const usePayrollStore = defineStore("payroll", {
  state: (): PayrollState => ({
    allPayrolls: [],
    paginatedItems: [],
    currentPage: 1,
    itemsPerPage: 10, // Default, can be changed by an action
    totalItems: 0,
    searchTerm: "",
    filterPayPeriod: "", // Initialize with empty or default
    isLoading: false,
    error: null,
  }),

  actions: {
    _applyFiltersAndPagination() {
      let filtered = this.allPayrolls;
      // 1. Filter by searchTerm (client-side on the `allPayrolls` list)
      if (this.searchTerm) {
        const lowerSearch = this.searchTerm.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.employeeName.toLowerCase().includes(lowerSearch) ||
            p.uid.toLowerCase().includes(lowerSearch)
        );
      }
      this.totalItems = filtered.length;
      // 2. Paginate
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      this.paginatedItems = filtered.slice(start, end);
    },

    async fetchPayrolls() {
      this.isLoading = true;
      this.error = null;
      try {
        const payrollsCol = collection(db, PAYROLL_COLLECTION);
        let q = query(payrollsCol);
        // Apply payPeriod filter for the main DB query
        if (this.filterPayPeriod) {
          q = query(
            payrollsCol,
            where("pay_period", "==", this.filterPayPeriod),
            orderBy("employeeName", "asc")
          );
        } else {
          // If no payPeriod, fetch all (could be large, consider default behavior)
          // Or, prompt user to select a period. For now, order by period then employeeName.
          q = query(
            payrollsCol,
            orderBy("pay_period", "desc"),
            orderBy("employeeName", "asc")
          );
        }
        const payrollSnapshot = await getDocs(q);
        this.allPayrolls = payrollSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Payroll)
        );
        this._applyFiltersAndPagination(); // Apply search and pagination to the fetched data
      } catch (err) {
        console.error("Error fetching payrolls:", err);
        this.error =
          err instanceof Error ? err.message : "Failed to fetch payrolls";
        this.allPayrolls = [];
        this.paginatedItems = [];
        this.totalItems = 0;
      } finally {
        this.isLoading = false;
      }
    },

    setSearchTerm(term: string) {
      this.searchTerm = term;
      this.currentPage = 1; // Reset to first page on new search
      this._applyFiltersAndPagination();
    },

    setFilterPayPeriod(period: string) {
      this.filterPayPeriod = period;
      this.currentPage = 1; // Reset to first page
      // Fetching is needed because payPeriod is a DB query filter
      return this.fetchPayrolls(); // Return promise for await
    },

    setCurrentPage(page: number) {
      if (page > 0 && page <= this.totalPages) {
        this.currentPage = page;
        this._applyFiltersAndPagination();
      }
    },

    setItemsPerPage(limit: number) {
      this.itemsPerPage = limit;
      this.currentPage = 1;
      this._applyFiltersAndPagination();
    },

    async addPayroll(payrollData: PayrollInputData): Promise<Payroll | null> {
      // isLoading and error are handled by the calling component or a global interceptor
      // This action should focus on the DB operation and minimal state update.
      try {
        const q = query(
          collection(db, PAYROLL_COLLECTION),
          where("uid", "==", payrollData.uid),
          where("pay_period", "==", payrollData.pay_period)
        );
        const existingSnapshot = await getDocs(q);
        if (!existingSnapshot.empty) {
          throw new Error(
            `Payroll for ${payrollData.employeeName} (${payrollData.uid}) for period ${payrollData.pay_period} already exists.`
          );
        }

        const netSalary = calculateNetSalary(payrollData);
        const now = serverTimestamp() as AppTimestamp;
        const newPayrollDoc: Omit<Payroll, "id"> = {
          ...payrollData,
          netSalary,
          status: PayrollAllStatus.Pending,
          paidOn: null,
          created_at: now,
          updated_at: now,
          department_id: payrollData.department_id || "",
          paidBy: "",
        };
        const docRef = await addDoc(
          collection(db, PAYROLL_COLLECTION),
          newPayrollDoc
        );
        // After adding, re-fetch to ensure allPayrolls is up-to-date and pagination/filters apply correctly.
        // Or, if the new item matches current filters, add it and re-apply local filters.
        // For simplicity and consistency:
        // await this.fetchPayrolls(); // This will apply current filters including payPeriod
        return {
          id: docRef.id,
          ...newPayrollDoc,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        } as Payroll; // return the optimistic object
      } catch (err) {
        console.error("Error adding payroll:", err);
        this.error =
          err instanceof Error ? err.message : "Failed to add payroll"; // Set store error
        throw err; // Re-throw for component to catch
      }
    },

    async updatePayroll(
      payrollId: string,
      updates: Partial<PayrollInputData & { notes?: string }>
    ): Promise<Payroll | null> {
      try {
        const payrollRef = doc(db, PAYROLL_COLLECTION, payrollId);
        const updateDataFS: Partial<Payroll> = {
          ...updates,
          updated_at: serverTimestamp() as AppTimestamp,
        };

        if (
          Object.keys(updates).some((k) =>
            [
              "base_salary",
              "working_days",
              "days_present",
              "overtime_hours",
              "overtime_rate",
              "bonuses",
              "deductions",
              "tax_percent",
            ].includes(k)
          )
        ) {
          const docSnap = await getDoc(payrollRef);
          if (!docSnap.exists()) throw new Error("Payroll document not found.");
          const existingPayroll = docSnap.data() as Payroll;
          const dataForCalc = {
            base_salary: updates.base_salary ?? existingPayroll.base_salary,
            working_days: updates.working_days ?? existingPayroll.working_days,
            days_present: updates.days_present ?? existingPayroll.days_present,
            overtime_hours:
              updates.overtime_hours ?? existingPayroll.overtime_hours,
            overtime_rate:
              updates.overtime_rate ?? existingPayroll.overtime_rate,
            bonuses: updates.bonuses ?? existingPayroll.bonuses,
            deductions: updates.deductions ?? existingPayroll.deductions,
            tax_percent: updates.tax_percent ?? existingPayroll.tax_percent,
          };
          updateDataFS.netSalary = calculateNetSalary(dataForCalc);
        }
        await updateDoc(payrollRef, updateDataFS);
        // await this.fetchPayrolls();
        const updatedDoc = await getDoc(payrollRef); // Get the updated doc for return
        return updatedDoc.exists()
          ? ({ id: updatedDoc.id, ...updatedDoc.data() } as Payroll)
          : null;
      } catch (err) {
        console.error("Error updating payroll:", err);
        this.error =
          err instanceof Error ? err.message : "Failed to update payroll";
        throw err;
      }
    },

    async deletePayroll(payrollId: string): Promise<boolean> {
      try {
        await deleteDoc(doc(db, PAYROLL_COLLECTION, payrollId));
        // Remove from local `allPayrolls` and re-filter/paginate
        this.allPayrolls = this.allPayrolls.filter((p) => p.id !== payrollId);
        this._applyFiltersAndPagination(); // Important to update paginatedItems
        return true;
      } catch (err) {
        console.error("Error deleting payroll:", err);
        this.error =
          err instanceof Error ? err.message : "Failed to delete payroll";
        throw err;
      }
    },

    async processPayment(
      payrollId: string,
      paidBy: string
    ): Promise<Payroll | null> {
      try {
        const payrollRef = doc(db, PAYROLL_COLLECTION, payrollId);
        // Optional: Fetch current doc to check status before updating if needed
        // const currentDoc = await getDoc(payrollRef);
        // if (currentDoc.exists() && (currentDoc.data() as Payroll).status === PayrollAllStatus.Paid) {
        //   throw new Error("Payroll already marked as paid.");
        // }
        await updateDoc(payrollRef, {
          status: PayrollAllStatus.Paid,
          paidOn: Timestamp.now(),
          paidBy,
          updated_at: serverTimestamp(),
        });
        // await this.fetchPayrolls();
        const updatedDoc = await getDoc(payrollRef);
        return updatedDoc.exists()
          ? ({ id: updatedDoc.id, ...updatedDoc.data() } as Payroll)
          : null;
      } catch (err) {
        console.error("Error processing payment:", err);
        this.error =
          err instanceof Error ? err.message : "Failed to process payment";
        throw err;
      }
    },

    async recordPaymentFailure(
      payrollId: string,
      reason: string,
      failedBy: string
    ): Promise<Payroll | null> {
      try {
        const payrollRef = doc(db, PAYROLL_COLLECTION, payrollId);
        const currentDoc = await getDoc(payrollRef);
        const currentNotes = currentDoc.exists()
          ? (currentDoc.data() as Payroll).notes || ""
          : "";
        const newNotes = `${currentNotes}${
          currentNotes ? "\n" : ""
        }Payment failed by ${failedBy}: ${reason}`;

        await updateDoc(payrollRef, {
          status: PayrollAllStatus.Failed,
          paidOn: null,
          notes: newNotes,
          updated_at: serverTimestamp(),
        });
        // await this.fetchPayrolls();
        const updatedDoc = await getDoc(payrollRef);
        return updatedDoc.exists()
          ? ({ id: updatedDoc.id, ...updatedDoc.data() } as Payroll)
          : null;
      } catch (err) {
        console.error("Error recording payment failure:", err);
        this.error =
          err instanceof Error
            ? err.message
            : "Failed to record payment failure";
        throw err;
      }
    },
  },

  getters: {
    totalPages: (state) => Math.ceil(state.totalItems / state.itemsPerPage),
    // other getters can remain as they were, operating on `allPayrolls` if needed
    getPayrollById:
      (state) =>
      (id: string): Payroll | undefined =>
        state.allPayrolls.find((p) => p.id === id),
  },
});
