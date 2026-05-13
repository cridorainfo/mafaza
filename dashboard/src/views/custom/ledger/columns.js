const toNumber = value => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}


export const columns = [
  {
    name: 'User Name',
    selector: row => row.User?.id,
    cell: row => <span>{row.User?.name || "N/A" }</span>,
    hideFor: ["user"]
  },
  {
    name: 'Projects',
    selector: row => row.Project?.id,
    cell: row => <span>{row.Project?.name || row?.projectDetails?.map(p => p.name).join(", ") || "N/A" }</span>
  },
  // {
  //   name: 'Net returns',
  //   selector: row => row.investment,
  //   cell: row => <span>{(row.investment - row.withdrawal + row.returns).toFixed(2) || "N/A" } AED</span>
  // },
  {
    name: 'Investment',
    selector: row => row.investment,
    cell: row => <span>{toNumber(row.investment).toFixed(2)} AED</span>
  },
  {
    name: 'Returns',
    selector: row => row.returns,
    cell: row => <span>{toNumber(row.returns).toFixed(2)} AED</span>
  },
  {
    name: 'Withdrawal',
    selector: row => row.withdrawal,
    cell: row => <span>{toNumber(row.withdrawal).toFixed(2)} AED</span>
  },
  {
    name: 'Overall Balance',
    selector: row => toNumber(row.investment) + toNumber(row.returns) - toNumber(row.withdrawal),
    sortable: true,
    minWidth: '150px',
    cell: row => (
      <span>
        {(toNumber(row.investment) + toNumber(row.returns) - toNumber(row.withdrawal)).toFixed(2)} AED
      </span>
    )
  }
]
