import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import FinancialPlatformLayout from '@/components/layout/FinancialPlatformLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calculator, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  name: z.string().min(1, 'Model name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  project_name: z.string().max(100, 'Project name must be less than 100 characters').optional(),
  country: z.string().min(1, 'Country is required'),
  start_year: z.number().min(2020, 'Start year must be 2020 or later').max(2050, 'Start year must be 2050 or earlier'),
  end_year: z.number().min(2021, 'End year must be after start year').max(2070, 'End year must be 2070 or earlier'),
}).refine((data) => data.end_year > data.start_year, {
  message: "End year must be after start year",
  path: ["end_year"],
});

type FormValues = z.infer<typeof formSchema>;

const NewFinancialModel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      project_name: '',
      country: '',
      start_year: new Date().getFullYear(),
      end_year: new Date().getFullYear() + 10,
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_models')
        .insert({
          user_id: user.id,
          name: values.name,
          description: values.description || null,
          project_name: values.project_name || null,
          country: values.country,
          start_year: values.start_year,
          end_year: values.end_year,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error creating model",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Model created successfully",
        description: "Your financial model has been created. You can now start adding inputs.",
      });

      navigate(`/financial/models/${data.id}`);
    } catch (error) {
      console.error('Error creating model:', error);
      toast({
        title: "Error",
        description: "Failed to create financial model",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Common countries for carbon projects
  const countries = [
    'Brazil', 'Colombia', 'Peru', 'Ecuador', 'Bolivia',
    'Indonesia', 'Malaysia', 'Philippines', 'Vietnam', 'Thailand',
    'Kenya', 'Tanzania', 'Uganda', 'Ghana', 'Nigeria',
    'India', 'China', 'Myanmar', 'Cambodia', 'Laos',
    'Mexico', 'Guatemala', 'Costa Rica', 'Panama', 'Honduras',
    'Papua New Guinea', 'Fiji', 'Solomon Islands',
    'Other'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 51 }, (_, i) => currentYear + i - 5); // 5 years back to 45 years forward

  return (
    <FinancialPlatformLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/financial/models')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Models
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Calculator className="h-8 w-8 text-trust" />
            Create New Financial Model
          </h1>
          <p className="text-muted-foreground">
            Set up the basic parameters for your carbon project financial model.
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Project Setup</CardTitle>
            <CardDescription>
              Define the basic parameters for your financial model. You can modify these later if needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Model Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Amazon Reforestation Project Model" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Country */}
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Project Name */}
                <FormField
                  control={form.control}
                  name="project_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Acre Forest Conservation Initiative" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the project and financial model scope..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Projection Years */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Projection Period</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="start_year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Year</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {years.slice(0, 30).map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Year</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => navigate('/financial/models')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-trust hover:bg-trust/90"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Creating...' : 'Create Model'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </FinancialPlatformLayout>
  );
};

export default NewFinancialModel;