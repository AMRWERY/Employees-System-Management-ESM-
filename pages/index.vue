<template>
  <div>
    <!-- download-button component -->
    <download-button tableId="invoicesTable" filename="invoices-data" class="mb-4" />

    <div class="flex items-center justify-between w-full pl-3 mt-1 mb-3">
      <div>
        <h3 class="text-lg font-semibold text-slate-800">Projects with Invoices</h3>
        <p class="text-slate-500">Overview of the current activities.</p>
      </div>
      <div class="ml-3">
        <div class="w-full max-w-sm min-w-[200px] relative">
          <div class="relative">
            <input
              class="w-full h-10 py-2 pl-3 text-sm transition duration-200 bg-transparent bg-white border rounded shadow-sm pr-11 placeholder:text-slate-400 text-slate-700 border-slate-200 ease focus:outline-none focus:border-slate-400 hover:border-slate-400 focus:shadow-md"
              placeholder="Search for invoice..." />
            <button class="absolute flex items-center w-8 h-8 px-2 my-auto bg-white rounded right-1 top-1 "
              type="button">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3"
                stroke="currentColor" class="w-8 h-8 text-slate-600">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      class="relative flex flex-col w-full h-full overflow-scroll text-gray-700 bg-white rounded-lg shadow-md bg-clip-border">
      <table id="invoicesTable" class="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th class="p-4 border-b border-slate-200 bg-slate-50">
              <p class="text-sm font-normal leading-none text-slate-500">
                Invoice Number
              </p>
            </th>
            <th class="p-4 border-b border-slate-200 bg-slate-50">
              <p class="text-sm font-normal leading-none text-slate-500">
                Customer
              </p>
            </th>
            <th class="p-4 border-b border-slate-200 bg-slate-50">
              <p class="text-sm font-normal leading-none text-slate-500">
                Amount
              </p>
            </th>
            <th class="p-4 border-b border-slate-200 bg-slate-50">
              <p class="text-sm font-normal leading-none text-slate-500">
                Issued
              </p>
            </th>
            <th class="p-4 border-b border-slate-200 bg-slate-50">
              <p class="text-sm font-normal leading-none text-slate-500">
                Due Date
              </p>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b hover:bg-slate-50 border-slate-200">
            <td class="p-4 py-5">
              <p class="block text-sm font-semibold text-slate-800">PROJ1001</p>
            </td>
            <td class="p-4 py-5">
              <p class="text-sm text-slate-500">John Doe</p>
            </td>
            <td class="p-4 py-5">
              <p class="text-sm text-slate-500">$1,200.00</p>
            </td>
            <td class="p-4 py-5">
              <p class="text-sm text-slate-500">2024-08-01</p>
            </td>
            <td class="p-4 py-5">
              <p class="text-sm text-slate-500">2024-08-15</p>
            </td>
          </tr>
          <tr class="border-b hover:bg-slate-50 border-slate-200">
            <td class="p-4 py-5">
              <p class="block text-sm font-semibold text-slate-800">PROJ1002</p>
            </td>
            <td class="p-4 py-5">
              <p class="text-sm text-slate-500">Jane Smith</p>
            </td>
            <td class="p-4 py-5">
              <p class="text-sm text-slate-500">$850.00</p>
            </td>
            <td class="p-4 py-5">
              <p class="text-sm text-slate-500">2024-08-05</p>
            </td>
            <td class="p-4 py-5">
              <p class="text-sm text-slate-500">2024-08-20</p>
            </td>
          </tr>
          <tr class="border-b hover:bg-slate-50 border-slate-200">
            <td class="p-4 py-5">
              <p class="block text-sm font-semibold text-slate-800">PROJ1003</p>
            </td>
            <td class="p-4 py-5">
              <p class="text-sm text-slate-500">Acme Corp</p>
            </td>
            <td class="p-4 py-5">
              <p class="text-sm text-slate-500">$2,500.00</p>
            </td>
            <td class="p-4 py-5">
              <p class="text-sm text-slate-500">2024-08-07</p>
            </td>
            <td class="p-4 py-5">
              <p class="text-sm text-slate-500">2024-08-21</p>
            </td>
          </tr>
          <tr class="border-b hover:bg-slate-50 border-slate-200">
            <td class="p-4 py-5">
              <p class="block text-sm font-semibold text-slate-800">PROJ1004</p>
            </td>
            <td class="p-4 py-5">
              <p class="text-sm text-slate-500">Global Inc</p>
            </td>
            <td class="p-4 py-5">
              <p class="text-sm text-slate-500">$4,750.00</p>
            </td>
            <td class="p-4 py-5">
              <p class="text-sm text-slate-500">2024-08-10</p>
            </td>
            <td class="p-4 py-5">
              <p class="text-sm text-slate-500">2024-08-25</p>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="flex items-center justify-between px-4 py-3">
        <div class="text-sm text-slate-500">
          Showing <b>1-5</b> of 45
        </div>
        <div class="flex space-x-1">
          <button
            class="px-3 py-1 text-sm font-normal transition duration-200 bg-white border rounded min-w-9 min-h-9 text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-400 ease">
            Prev
          </button>
          <button
            class="px-3 py-1 text-sm font-normal text-white transition duration-200 border rounded min-w-9 min-h-9 bg-slate-800 border-slate-800 hover:bg-slate-600 hover:border-slate-600 ease">
            1
          </button>
          <button
            class="px-3 py-1 text-sm font-normal transition duration-200 bg-white border rounded min-w-9 min-h-9 text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-400 ease">
            2
          </button>
          <button
            class="px-3 py-1 text-sm font-normal transition duration-200 bg-white border rounded min-w-9 min-h-9 text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-400 ease">
            3
          </button>
          <button
            class="px-3 py-1 text-sm font-normal transition duration-200 bg-white border rounded min-w-9 min-h-9 text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-400 ease">
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>

</script>