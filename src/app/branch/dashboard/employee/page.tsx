export const metadata = {
  title: "Employee Management",
}
import { EmployeeSkeleton } from '@/components/Dashboard/employee/EmployeeSkeleton'
import Employee from '@/components/Dashboard/employee/page'
import { Suspense } from 'react'

export default function Page() {
  return (
      <Suspense fallback={<EmployeeSkeleton />}>
          <Employee />
      </Suspense>
  )
}