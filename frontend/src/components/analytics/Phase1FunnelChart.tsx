import { Cell, Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip } from 'recharts';

interface Phase1FunnelChartProps {
  data: { stage: string; value: number }[];
}

const COLORS = ['#2FD9C7', '#5B9EFF', '#A78BFA', '#06D369'];

export function Phase1FunnelChart({ data }: Phase1FunnelChartProps) {
  return (
    <div className="h-80 w-full" aria-label="Campaign conversion funnel">
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip
            contentStyle={{
              background: '#15191F',
              border: '1px solid #2D3748',
              borderRadius: 12,
              color: '#F5F7FB',
            }}
          />
          <Funnel dataKey="value" data={data} isAnimationActive>
            <LabelList
              position="right"
              fill="#F5F7FB"
              stroke="none"
              dataKey="stage"
              formatter={(value: unknown) => String(value)}
            />
            {data.map((item, index) => (
              <Cell key={`${item.stage}-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  );
}
