import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

interface Scenario {
  id: string;
  name: string;
  isBaseCase: boolean;
  variables: Record<string, number>;
  metrics?: any;
}

interface ScenarioChartsProps {
  selectedScenarios: Scenario[];
}

const ScenarioCharts = ({ selectedScenarios }: ScenarioChartsProps) => {
  if (selectedScenarios.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            Select scenarios to compare using the checkboxes below
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare key metrics data for bar chart
  const metricsData = [
    {
      metric: 'Equity NPV',
      ...Object.fromEntries(
        selectedScenarios.map(s => [
          s.name,
          s.metrics?.returns?.equityNPV || 0
        ])
      )
    },
    {
      metric: 'Equity IRR',
      ...Object.fromEntries(
        selectedScenarios.map(s => [
          s.name,
          (s.metrics?.returns?.equityIRR || 0) * 100
        ])
      )
    },
    {
      metric: 'Project NPV',
      ...Object.fromEntries(
        selectedScenarios.map(s => [
          s.name,
          s.metrics?.returns?.projectNPV || 0
        ])
      )
    },
    {
      metric: 'Total Revenue',
      ...Object.fromEntries(
        selectedScenarios.map(s => [
          s.name,
          s.metrics?.profitability?.totalRevenue || 0
        ])
      )
    }
  ];

  // Prepare NPV over time data for line chart
  const npvOverTimeData = selectedScenarios[0]?.metrics?.profitability?.yearlyFinancials?.map(
    (_: any, yearIndex: number) => {
      const dataPoint: any = { year: `Year ${yearIndex + 1}` };
      selectedScenarios.forEach(scenario => {
        const yearlyData = scenario.metrics?.profitability?.yearlyFinancials?.[yearIndex];
        dataPoint[scenario.name] = yearlyData?.netIncome || 0;
      });
      return dataPoint;
    }
  ) || [];

  // Chart configuration
  const chartConfig = Object.fromEntries(
    selectedScenarios.map((s, idx) => [
      s.name,
      {
        label: s.name,
        color: `hsl(var(--chart-${(idx % 5) + 1}))`
      }
    ])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visual Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bar">Key Metrics</TabsTrigger>
            <TabsTrigger value="line">Net Income Trend</TabsTrigger>
          </TabsList>

          <TabsContent value="bar" className="space-y-4">
            <ChartContainer config={chartConfig} className="h-[400px]">
              <BarChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {selectedScenarios.map((scenario, idx) => (
                  <Bar
                    key={scenario.id}
                    dataKey={scenario.name}
                    fill={`hsl(var(--chart-${(idx % 5) + 1}))`}
                  />
                ))}
              </BarChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="line" className="space-y-4">
            <ChartContainer config={chartConfig} className="h-[400px]">
              <LineChart data={npvOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {selectedScenarios.map((scenario, idx) => (
                  <Line
                    key={scenario.id}
                    type="monotone"
                    dataKey={scenario.name}
                    stroke={`hsl(var(--chart-${(idx % 5) + 1}))`}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ScenarioCharts;
