import { cx } from "@/utils/cx";
import { Disc, Line, Pill, SkeletonRoot } from "./parts";

/** Settings while it loads: back button and title, the profile row, then the five sections of rows. */
export function SettingsSkeleton() {
  return (
    <SkeletonRoot>
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 grid grid-cols-[44px_1fr_44px] items-center">
          <Disc size={44} className="bg-transparent" />
          <span className="flex justify-center"><Line lh={28} h={16} w={88} /></span>
          <span />
        </header>

        <div className="flex items-center gap-4 rounded-[24px] px-1 py-2">
          <Disc size={56} />
          <span className="min-w-0 flex-1">
            <Line lh={28} h={17} w={120} />
            <Line lh={20} h={11} w={170} />
          </span>
          <Disc size={40} />
        </div>

        <Section className="mt-6" title={92} rows={[{ value: 70 }, { value: 56 }, { value: 36 }]} />
        <Section title={104} rows={[{ toggle: true }, { toggle: true }, { toggle: true }]} help />
        <Section title={72} rows={[{ value: 40, sub: true }, { value: 44, sub: true }]} />
        <Section title={64} rows={[{ value: 90, sub: true }, { value: 74 }, { value: 30 }]} />
        <Section title={72} rows={[{}, {}, {}]} />
      </div>
    </SkeletonRoot>
  );
}

type RowSpec = { value?: number; sub?: boolean; toggle?: boolean };

/** ListSection: a quiet label, then rows of icon · label (· sub) · value or toggle. */
function Section({ title, rows, help, className }: { title: number; rows: RowSpec[]; help?: boolean; className?: string }) {
  return (
    <section className={cx("mt-8 first:mt-0", className)}>
      <Line lh={20} h={11} w={title} className="mb-1 px-1" />
      <ul className="grid grid-cols-1">
        {rows.map((r, i) => (
          <li key={i} className="flex min-h-14 items-center gap-3.5 px-1 py-2">
            <Disc size={24} className="mx-[2px] rounded-md" />
            <span className="min-w-0 flex-1">
              <Line lh={24} h={14} w={`${34 + ((i * 13) % 22)}%`} />
              {r.sub && <Line lh={20} h={11} w="46%" />}
            </span>
            {r.toggle ? <Pill w={44} h={26} /> : r.value ? <Line lh={24} h={13} w={r.value} /> : <Disc size={16} />}
          </li>
        ))}
        {help && <li className="px-1 pb-1 pt-1"><Line lh={20} h={11} w="80%" /></li>}
      </ul>
    </section>
  );
}
