const fs = require('fs');
const file = './frontend/src/routes/index.tsx';
let content = fs.readFileSync(file, 'utf8');

const newCard = `function HitlApprovalCard({
  status,
  onDecision,
}: {
  status: ApprovalStatus;
  onDecision: (value: ApprovalStatus) => void;
}) {
  const isPending = status === "pending";
  return (
    <section
      className="mt-4 w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
      aria-label="Budget reallocation approval"
    >
      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
        <div className="flex gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500">
              Human approval required
            </p>
            <h2 className="mt-1 font-display text-base font-semibold text-zinc-900">
              Pending Action: Budget Reallocation
            </h2>
          </div>
        </div>
        <div className="shrink-0 pt-1">
          {isPending ? (
            <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
              Pending
            </span>
          ) : status === "approved" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
              <CircleCheck className="size-3.5" aria-hidden="true" />
              Approved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
              <X className="size-3.5" aria-hidden="true" />
              Rejected
            </span>
          )}
        </div>
      </div>
      <div className="flex bg-zinc-50/50 text-sm">
        <div className="flex-1 border-r border-zinc-200 px-5 py-3">
          <p className="text-xs text-zinc-500">Platform</p>
          <p className="mt-1 font-medium text-zinc-900">Google Ads / Meta</p>
        </div>
        <div className="flex-1 border-r border-zinc-200 px-5 py-3">
          <p className="text-xs text-zinc-500">Campaign ID</p>
          <p className="mt-1 font-medium text-zinc-900">12345</p>
        </div>
        <div className="flex-1 px-5 py-3">
          <p className="text-xs text-zinc-500">Proposed Change</p>
          <p className="mt-1 font-medium text-zinc-900">-20% / +$500</p>
        </div>
      </div>
      {isPending && (
        <div className="flex gap-3 border-t border-zinc-200 p-4 bg-white">
          <Button
            onClick={() => onDecision("approved")}
            className="flex-1 gap-2 bg-green-600 text-white hover:bg-green-700 rounded-xl"
          >
            <Check aria-hidden="true" className="size-4" /> Approve & Deploy
          </Button>
          <Button
            onClick={() => onDecision("rejected")}
            className="flex-1 gap-2 bg-red-600 text-white hover:bg-red-700 rounded-xl"
          >
            <X aria-hidden="true" className="size-4" /> Reject
          </Button>
        </div>
      )}
    </section>
  );
}`;

content = content.replace(/function HitlApprovalCard[\s\S]*?\}\s*import \{ SilkGradient/, newCard + "\n\nimport { SilkGradient");
fs.writeFileSync(file, content);
