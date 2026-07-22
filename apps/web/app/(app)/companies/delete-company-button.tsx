"use client";

import { deleteCompany } from "@/lib/actions/companies";

export function DeleteCompanyButton({
  companyId,
  companyName,
  className,
}: {
  companyId: string;
  companyName: string;
  className: string;
}) {
  return (
    <form
      action={deleteCompany.bind(null, companyId)}
      onSubmit={(e) => {
        if (
          !confirm(
            `ลบบริษัท "${companyName}" ถาวร?\n\nข้อมูล Deals, Contacts, ประวัติการติดต่อ, ใบเสนอราคา และเอกสารทั้งหมดของบริษัทนี้จะถูกลบไปด้วย และไม่สามารถกู้คืนได้`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className={className}>
        ลบ
      </button>
    </form>
  );
}
