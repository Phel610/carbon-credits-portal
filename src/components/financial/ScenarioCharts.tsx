import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle } from 'lucide-react';
import { HelpTooltip } from '@/components/help/HelpTooltip';
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
  // Debug logging
  console.log('[ScenarioCharts] Selected scenarios:', selectedScenarios.map(s => ({
    name: s.name,
    hasMetrics: !!s.metrics,
    metricsStructure: s.metrics ? Object.keys(s.metrics) : []
  })));

  if (selectedScenarios.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visual Comparison Charts</CardTitle>
          <CardDescription>Compare scenarios visually with interactive charts</CardDescription>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="text-muted-foreground">
              No scenarios selected for comparison
            </div>
            <div className="text-sm text-muted-foreground">
              Check the boxes next to scenarios in the table below to visualize and compare their performance
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare key metrics data for bar chart (FIXED: Using correct nested paths)
  const metricsData = [
    {
      metric: 'Equity NPV',
      ...Object.fromEntries(
        selectedScenarios.map(s => {
          const value = s.metrics?.returns?.equity?.npv || 0;
          console.log(`[Chart] ${s.name} - Equity NPV:`, value);
          return [s.name, value];
        })
      )
    },
    {
      metric: 'Equity IRR (%)',
      ...Object.fromEntries(
        selectedScenarios.map(s => {
          const value = (s.metrics?.returns?.equity?.irr || 0) * 100;
          console.log(`[Chart] ${s.name} - Equity IRR:`, value);
          return [s.name, value];
        })
      )
    },
    {
      metric: 'Project NPV',
      ...Object.fromEntries(
        selectedScenarios.map(s => {
          const value = s.metrics?.returns?.project?.npv || 0;
          console.log(`[Chart] ${s.name} - Project NPV:`, value);
          return [s.name, value];
        })
      )
    },
    {
      metric: 'Total Revenue',
      ...Object.fromEntries(
        selectedScenarios.map(s => {
          const value = s.metrics?.profitability?.total?.revenue || 0;
          console.log(`[Chart] ${s.name} - Total Revenue:`, value);
          return [s.name, value];
        })
      )
    }
  ];

  // Prepare net income trend data for line chart (FIXED: Using correct yearlyFinancials path)
  const npvOverTimeData = selectedScenarios[0]?.metrics?.yearlyFinancials?.map(
    (_: any, yearIndex: number) => {
      const dataPoint: any = { year: `Year ${yearIndex + 1}` };
      selectedScenarios.forEach(scenario => {
        const yearlyData = scenario.metrics?.yearlyFinancials?.[yearIndex];
        const netIncome = yearlyData?.netIncome || 0;
        console.log(`[Chart] ${scenario.name} - Year ${yearIndex + 1} Net Income:`, netIncome);
        dataPoint[scenario.name] = netIncome;
      });
      return dataPoint;
    }
  ) || [];

  console.log('[ScenarioCharts] Net Income Trend Data:', npvOverTimeData);

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
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              Visual Comparison Charts
              <HelpTooltip 
                content="Compare scenarios side-by-side with interactive charts. The bar chart shows key financial metrics, while the line chart displays net income trends over time. Hover over data points for detailed values."
                iconOnly
              />
            </CardTitle>
            <CardDescription>
              Comparing {selectedScenarios.length} scenario{selectedScenarios.length > 1 ? 's' : ''}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bar">Key Metrics</TabsTrigger>
            <TabsTrigger value="line">Net Income Trend</TabsTrigger>
          </TabsList>

          <TabsContent value="bar" className="space-y-4">
            <div className="mb-4 text-sm text-muted-foreground">
              Compare key financial metrics across scenarios. Values shown are absolute, not percentages.
            </div>
            <ChartContainer config={chartConfig} className="h-[400px]">
              <BarChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent payload={[]} />} />
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
            <div className="mb-4 text-sm text-muted-foreground">
              Track net income performance across the project timeline for each scenario.
            </div>
            {npvOverTimeData.length === 0 ? (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground border rounded-lg">
                <div className="text-center space-y-2">
                  <p>No yearly financial data available</p>
                  <p className="text-xs">Ensure metrics have been calculated for selected scenarios</p>
                </div>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[400px]">
                <LineChart data={npvOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent payload={[]} />} />
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
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ScenarioCharts;
