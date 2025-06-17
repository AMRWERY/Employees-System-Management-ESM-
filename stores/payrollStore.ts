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
  arrayUnion,
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
  type PayrollSummary,
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
        // console.error("Error fetching payrolls:", err);
        this.error =
          err instanceof Error ? err.message : "Failed to fetch payrolls";
        this.allPayrolls = [];
        this.paginatedItems = [];
        this.totalItems = 0;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchPayrollsByEmployeeId(employeeId: string): Promise<Payroll[]> {
      const payrollsQuery = query(
        collection(db, PAYROLL_COLLECTION),
        where("uid", "==", employeeId),
        orderBy("pay_period", "desc")
      );
      const querySnapshot = await getDocs(payrollsQuery);
      const payrolls = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        // console.log("Payroll document data:", data);
        return {
          id: doc.id,
          uid: data.uid || employeeId,
          employeeName: data.employeeName || "",
          department_id: data.department_id || "",
          pay_period: data.pay_period || "",
          base_salary: data.base_salary || 0,
          working_days: data.working_days || 0,
          days_present: data.days_present || 0,
          overtime_hours: data.overtime_hours || 0,
          overtime_rate: data.overtime_rate || 0,
          bonuses: data.bonuses || 0,
          deductions: data.deductions || 0,
          deductions_reason: data.deductions_reason || null,
          tax_percent: data.tax_percent || 0,
          netSalary: data.netSalary || 0,
          status: data.status || PayrollAllStatus.Pending,
          paidOn: data.paidOn?.toDate() || null,
          paidBy: data.paidBy || null,
          created_by: data.created_by || "",
          created_at: data.created_at || new Timestamp(0, 0),
          updated_at: data.updated_at?.toDate() || null,
          notes: data.notes || null,
          failureReason: data.failureReason || null,
        } satisfies Payroll;
      });
      // console.log("Mapped payrolls:", payrolls);
      return payrolls;
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
      this.isLoading = true;
      this.error = null;
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
        const now = serverTimestamp();
        // Construct the object for Firestore, handling undefined explicitly
        const firestorePayrollData: any = {
          // Start with any, then narrow down
          uid: payrollData.uid,
          employeeName: payrollData.employeeName,
          department_id: payrollData.department_id || "", // Default to empty string
          pay_period: payrollData.pay_period,
          base_salary: payrollData.base_salary,
          working_days: payrollData.working_days,
          days_present: payrollData.days_present,
          overtime_hours: payrollData.overtime_hours,
          overtime_rate: payrollData.overtime_rate,
          bonuses: payrollData.bonuses,
          deductions: payrollData.deductions,
          deductions_reason: payrollData.deductions_reason || null,
          tax_percent: payrollData.tax_percent,
          created_by: payrollData.created_by,
          netSalary,
          status: PayrollAllStatus.Pending,
          paidOn: null, // Explicitly null
          paidBy: "", // Explicitly empty string
          created_at: now,
          updated_at: now,
        };
        if (payrollData.notes !== undefined) {
          firestorePayrollData.notes = payrollData.notes;
        } else {
          firestorePayrollData.notes = null; // Or "" or omit, based on preference
        }
        firestorePayrollData.failureReason = null;
        const typedFirestorePayrollData = firestorePayrollData as Omit<
          Payroll,
          "id" | "created_at" | "updated_at"
        > & { created_at: any; updated_at: any };
        const docRef = await addDoc(
          collection(db, PAYROLL_COLLECTION),
          typedFirestorePayrollData
        );
        // console.log("Payroll record created with ID:", docRef.id);
        const payrollSummary: PayrollSummary = {
          payrollDocId: docRef.id,
          pay_period: payrollData.pay_period,
          netSalary: netSalary,
          status: PayrollAllStatus.Pending,
          created_at: Timestamp.now(),
        };
        // Find and update employee document
        const employeesStore = useEmployeesStore();
        let employeeFirestoreId: string | null = null;
        const targetEmployee = employeesStore.employees.find(
          (emp) => emp.employeeId === payrollData.uid
        );
        if (targetEmployee && targetEmployee.id) {
          employeeFirestoreId = targetEmployee.id;
        } else {
          const userQuery = query(
            collection(db, "ems-users"),
            where("employeeId", "==", payrollData.uid)
          );
          const userSnapshot = await getDocs(userQuery);
          if (!userSnapshot.empty) {
            employeeFirestoreId = userSnapshot.docs[0].id;
          }
        }
        if (employeeFirestoreId) {
          const employeeDocRef = doc(db, "ems-users", employeeFirestoreId);
          try {
            await updateDoc(employeeDocRef, {
              payrolls: arrayUnion(payrollSummary),
            });
          } catch (updateError) {
            console.error(
              `Failed to update employee ${employeeFirestoreId} with payroll summary:`,
              updateError
            );
          }
        } else {
          console.error(
            `addPayroll: Critical - Could not find employee in ems-users with employeeId ${payrollData.uid} to update their payrolls array.`
          );
        }
        const createdPayroll: Payroll = {
          id: docRef.id,
          ...typedFirestorePayrollData, // Use the version that went to Firestore
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
          // Ensure optional fields from typedFirestorePayrollData are correctly typed in Payroll
          notes:
            typedFirestorePayrollData.notes === null
              ? undefined
              : typedFirestorePayrollData.notes,
          failureReason:
            typedFirestorePayrollData.failureReason === null
              ? undefined
              : typedFirestorePayrollData.failureReason,
        };
        // Update local store state
        if (
          this.filterPayPeriod === payrollData.pay_period ||
          !this.filterPayPeriod
        ) {
          // Ensure the object added to allPayrolls matches the Payroll type exactly
          const payrollToAdd = { ...createdPayroll };
          // If Payroll type has optional notes/failureReason, ensure they are undefined if null
          if (payrollToAdd.notes === null) delete payrollToAdd.notes;
          if (payrollToAdd.failureReason === null)
            delete payrollToAdd.failureReason;

          this.allPayrolls.unshift(payrollToAdd);
          this._applyFiltersAndPagination();
        }
        return createdPayroll;
      } catch (err) {
        // console.error("Error adding payroll:", err);
        this.error =
          err instanceof Error ? err.message : "Failed to add payroll";
        throw err;
      } finally {
        this.isLoading = false;
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
              "deductions_reason",
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
        // console.error("Error updating payroll:", err);
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
        // console.error("Error deleting payroll:", err);
        this.error =
          err instanceof Error ? err.message : "Failed to delete payroll";
        throw err;
      }
    },

    async _getEmployeeFirestoreId(
      payrollEmployeeId: string
    ): Promise<string | null> {
      const employeesStore = useEmployeesStore();
      let employeeFirestoreId: string | null = null;
      const targetEmployee = employeesStore.employees.find(
        (emp) => emp.employeeId === payrollEmployeeId
      );
      if (targetEmployee && targetEmployee.id) {
        employeeFirestoreId = targetEmployee.id;
      } else {
        // console.warn(`_getEmployeeFirestoreId: Employee not found in local store by ems-ID ${payrollEmployeeId}. Attempting Firestore query.`);
        const userQuery = query(
          collection(db, "ems-users"),
          where("employeeId", "==", payrollEmployeeId)
        );
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          employeeFirestoreId = userSnapshot.docs[0].id;
        } else {
          console.error(
            `_getEmployeeFirestoreId: Critical - Could not find employee in ems-users with employeeId ${payrollEmployeeId}.`
          );
        }
      }
      return employeeFirestoreId;
    },

    async processPayment(
      payrollDocId: string, // ID of the document in 'ems-payrolls'
      paidBy: string
    ): Promise<Payroll | null> {
      this.isLoading = true;
      this.error = null;
      const payrollRef = doc(db, PAYROLL_COLLECTION, payrollDocId);
      try {
        const payrollSnap = await getDoc(payrollRef);
        if (!payrollSnap.exists()) {
          throw new Error("Payroll record not found to mark as paid.");
        }
        const currentPayrollData = payrollSnap.data() as Payroll;
        // 1. Update the main payroll document in 'ems-payrolls'
        const updatedPayrollFields = {
          status: PayrollAllStatus.Paid,
          paidOn: Timestamp.now(),
          paidBy,
          updated_at: serverTimestamp(),
          failureReason: null, // Clear any previous failure reason
        };
        await updateDoc(payrollRef, updatedPayrollFields);
        // 2. Update the embedded summary in the employee's document
        if (currentPayrollData.uid) {
          // currentPayrollData.uid is the "ems-XXXX" employeeId
          const employeeFirestoreId = await this._getEmployeeFirestoreId(
            currentPayrollData.uid
          );
          if (employeeFirestoreId) {
            const employeeDocRef = doc(db, "ems-users", employeeFirestoreId);
            const employeeDocSnap = await getDoc(employeeDocRef);
            if (employeeDocSnap.exists()) {
              const employeeData = employeeDocSnap.data();
              const existingPayrolls = (employeeData.payrolls ||
                []) as PayrollSummary[];
              const updatedPayrolls = existingPayrolls.map((summary) =>
                summary.payrollDocId === payrollDocId
                  ? {
                      ...summary,
                      status: PayrollAllStatus.Paid,
                      failureReason: null,
                    } // Update status, clear failureReason
                  : summary
              );
              await updateDoc(employeeDocRef, { payrolls: updatedPayrolls });
              // console.log(`Employee ${employeeFirestoreId} payrolls array updated for payment: ${payrollDocId}`);
            }
          }
        }
        const updatedDoc = await getDoc(payrollRef); // Get the fully updated doc
        return updatedDoc.exists()
          ? ({ id: updatedDoc.id, ...updatedDoc.data() } as Payroll)
          : null;
      } catch (err) {
        // console.error("Error processing payment:", err);
        this.error =
          err instanceof Error ? err.message : "Failed to process payment";
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async recordPaymentFailure(
      payrollDocId: string, // ID of the document in 'ems-payrolls'
      reason: string,
      failedBy: string
    ): Promise<Payroll | null> {
      this.isLoading = true;
      this.error = null;
      const payrollRef = doc(db, PAYROLL_COLLECTION, payrollDocId);
      try {
        const payrollSnap = await getDoc(payrollRef);
        if (!payrollSnap.exists()) {
          throw new Error("Payroll record not found to mark as failed.");
        }
        const currentPayrollData = payrollSnap.data() as Payroll;
        // Append to existing notes/failure reason if necessary
        const existingFailureNotes = currentPayrollData.failureReason || "";
        const newFailureReason = `${existingFailureNotes}${
          existingFailureNotes ? "\n" : ""
        }Payment failed by ${failedBy}: ${reason}`;
        // 1. Update the main payroll document in 'ems-payrolls'
        const updatedPayrollFields = {
          status: PayrollAllStatus.Failed,
          paidOn: null, // Ensure paidOn is null for failed
          failureReason: newFailureReason,
          updated_at: serverTimestamp(),
        };
        await updateDoc(payrollRef, updatedPayrollFields);
        // 2. Update the embedded summary in the employee's document
        if (currentPayrollData.uid) {
          // currentPayrollData.uid is the "ems-XXXX" employeeId
          const employeeFirestoreId = await this._getEmployeeFirestoreId(
            currentPayrollData.uid
          );
          if (employeeFirestoreId) {
            const employeeDocRef = doc(db, "ems-users", employeeFirestoreId);
            const employeeDocSnap = await getDoc(employeeDocRef);
            if (employeeDocSnap.exists()) {
              const employeeData = employeeDocSnap.data();
              const existingPayrolls = (employeeData.payrolls ||
                []) as PayrollSummary[];
              const updatedPayrolls = existingPayrolls.map((summary) =>
                summary.payrollDocId === payrollDocId
                  ? {
                      ...summary,
                      status: PayrollAllStatus.Failed,
                      failureReason: newFailureReason,
                    } // Update status and reason
                  : summary
              );
              await updateDoc(employeeDocRef, { payrolls: updatedPayrolls });
              // console.log(`Employee ${employeeFirestoreId} payrolls array updated for failure: ${payrollDocId}`);
            }
          }
        }
        const updatedDoc = await getDoc(payrollRef);
        return updatedDoc.exists()
          ? ({ id: updatedDoc.id, ...updatedDoc.data() } as Payroll)
          : null;
      } catch (err) {
        // console.error("Error recording payment failure:", err);
        this.error =
          err instanceof Error
            ? err.message
            : "Failed to record payment failure";
        throw err;
      } finally {
        this.isLoading = false;
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
