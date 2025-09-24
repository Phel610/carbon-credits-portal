import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Building, CreditCard, Handshake, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FinancingFormProps {
  modelId: string;
  model: {
    id: string;
    name: string;
    start_year: number;
    end_year: number;
  };
}

interface EquityInvestment {
  year: number;
  amount: number;
  investor_type: string;
}

interface DebtFacility {
  name: string;
  principal: number;
  interest_rate: number;
  term_years: number;
  drawdown_year: number;
}

interface PrePurchaseAgreement {
  buyer: string;
  credits_quantity: number;
  price_per_credit: number;
  advance_payment: number;
  delivery_year: number;
}

const FinancingForm = ({ modelId, model }: FinancingFormProps) => {
  // Equity investments by year
  const [equityInvestments, setEquityInvestments] = useState<EquityInvestment[]>([
    {
      year: model.start_year,
      amount: 0,
      investor_type: 'Founder Investment',
    }
  ]);

  // Debt facilities
  const [debtFacilities, setDebtFacilities] = useState<DebtFacility[]>([]);

  // Pre-purchase agreements
  const [prePurchaseAgreements, setPrePurchaseAgreements] = useState<PrePurchaseAgreement[]>([]);

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Equity Investment Functions
  const addEquityInvestment = () => {
    setEquityInvestments([
      ...equityInvestments,
      {
        year: model.start_year,
        amount: 0,
        investor_type: 'Series A',
      }
    ]);
  };

  const updateEquityInvestment = (index: number, field: keyof EquityInvestment, value: any) => {
    setEquityInvestments(prev => 
      prev.map((investment, i) => 
        i === index 
          ? { ...investment, [field]: value }
          : investment
      )
    );
  };

  const removeEquityInvestment = (index: number) => {
    setEquityInvestments(prev => prev.filter((_, i) => i !== index));
  };

  // Debt Facility Functions
  const addDebtFacility = () => {
    setDebtFacilities([
      ...debtFacilities,
      {
        name: 'Term Loan',
        principal: 0,
        interest_rate: 8.0,
        term_years: 5,
        drawdown_year: model.start_year,
      }
    ]);
  };

  const updateDebtFacility = (index: number, field: keyof DebtFacility, value: any) => {
    setDebtFacilities(prev => 
      prev.map((facility, i) => 
        i === index 
          ? { ...facility, [field]: value }
          : facility
      )
    );
  };

  const removeDebtFacility = (index: number) => {
    setDebtFacilities(prev => prev.filter((_, i) => i !== index));
  };

  // Pre-Purchase Agreement Functions
  const addPrePurchaseAgreement = () => {
    setPrePurchaseAgreements([
      ...prePurchaseAgreements,
      {
        buyer: 'Corporate Buyer',
        credits_quantity: 0,
        price_per_credit: 10,
        advance_payment: 0,
        delivery_year: model.start_year + 2,
      }
    ]);
  };

  const updatePrePurchaseAgreement = (index: number, field: keyof PrePurchaseAgreement, value: any) => {
    setPrePurchaseAgreements(prev => 
      prev.map((agreement, i) => 
        i === index 
          ? { ...agreement, [field]: value }
          : agreement
      )
    );
  };

  const removePrePurchaseAgreement = (index: number) => {
    setPrePurchaseAgreements(prev => prev.filter((_, i) => i !== index));
  };

  const saveFinancingStrategy = async () => {
    setLoading(true);
    try {
      const financingInputs = [
        // Equity investments
        ...equityInvestments.map((investment, index) => ({
          model_id: modelId,
          category: 'financing',
          input_key: 'equity_investment',
          input_value: investment as any,
          year: investment.year,
        })),
        // Debt facilities
        ...debtFacilities.map((facility, index) => ({
          model_id: modelId,
          category: 'financing',
          input_key: 'debt_facility',
          input_value: facility as any,
        })),
        // Pre-purchase agreements
        ...prePurchaseAgreements.map((agreement, index) => ({
          model_id: modelId,
          category: 'financing',
          input_key: 'pre_purchase_agreement',
          input_value: agreement as any,
        })),
        // Notes
        {
          model_id: modelId,
          category: 'financing',
          input_key: 'notes',
          input_value: { value: notes },
        },
      ];

      // Delete existing financing inputs
      const { error: deleteError } = await supabase
        .from('model_inputs')
        .delete()
        .eq('model_id', modelId)
        .eq('category', 'financing');

      if (deleteError) throw deleteError;

      // Insert new inputs
      const { error: insertError } = await supabase
        .from('model_inputs')
        .insert(financingInputs);

      if (insertError) throw insertError;

      toast({
        title: "Financing strategy saved",
        description: "Your financing strategy has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving financing strategy:', error);
      toast({
        title: "Error saving financing",
        description: "Failed to save financing data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalEquity = equityInvestments.reduce((sum, investment) => sum + investment.amount, 0);
  const totalDebt = debtFacilities.reduce((sum, facility) => sum + facility.principal, 0);
  const totalAdvancePayments = prePurchaseAgreements.reduce((sum, agreement) => sum + agreement.advance_payment, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Equity</CardDescription>
            <CardTitle className="text-2xl">${totalEquity.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Debt</CardDescription>
            <CardTitle className="text-2xl">${totalDebt.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pre-Purchase Advances</CardDescription>
            <CardTitle className="text-2xl">${totalAdvancePayments.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Equity Investments */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Equity Investments
              </CardTitle>
              <CardDescription>
                Founder investments, venture capital, and other equity financing
              </CardDescription>
            </div>
            <Button onClick={addEquityInvestment} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Investment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {equityInvestments.map((investment, index) => (
              <div key={index} className="grid gap-4 md:grid-cols-4 p-4 border rounded-lg">
                <div>
                  <Label>Investor Type</Label>
                  <Input
                    value={investment.investor_type}
                    onChange={(e) => updateEquityInvestment(index, 'investor_type', e.target.value)}
                    placeholder="e.g., Founder, Series A"
                  />
                </div>
                <div>
                  <Label>Investment Year</Label>
                  <Input
                    type="number"
                    value={investment.year}
                    onChange={(e) => updateEquityInvestment(index, 'year', Number(e.target.value))}
                    min={model.start_year}
                    max={model.end_year}
                  />
                </div>
                <div>
                  <Label>Amount (USD)</Label>
                  <Input
                    type="number"
                    value={investment.amount}
                    onChange={(e) => updateEquityInvestment(index, 'amount', Number(e.target.value))}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => removeEquityInvestment(index)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {equityInvestments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No equity investments added. Click "Add Investment" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debt Facilities */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Debt Facilities
              </CardTitle>
              <CardDescription>
                Bank loans, development finance, and other debt financing
              </CardDescription>
            </div>
            <Button onClick={addDebtFacility} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Debt Facility
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {debtFacilities.map((facility, index) => (
              <div key={index} className="grid gap-4 md:grid-cols-6 p-4 border rounded-lg">
                <div>
                  <Label>Facility Name</Label>
                  <Input
                    value={facility.name}
                    onChange={(e) => updateDebtFacility(index, 'name', e.target.value)}
                    placeholder="Term Loan"
                  />
                </div>
                <div>
                  <Label>Principal (USD)</Label>
                  <Input
                    type="number"
                    value={facility.principal}
                    onChange={(e) => updateDebtFacility(index, 'principal', Number(e.target.value))}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <Label>Interest Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={facility.interest_rate}
                    onChange={(e) => updateDebtFacility(index, 'interest_rate', Number(e.target.value))}
                    placeholder="8.0"
                    min="0"
                  />
                </div>
                <div>
                  <Label>Term (Years)</Label>
                  <Input
                    type="number"
                    value={facility.term_years}
                    onChange={(e) => updateDebtFacility(index, 'term_years', Number(e.target.value))}
                    placeholder="5"
                    min="1"
                  />
                </div>
                <div>
                  <Label>Drawdown Year</Label>
                  <Input
                    type="number"
                    value={facility.drawdown_year}
                    onChange={(e) => updateDebtFacility(index, 'drawdown_year', Number(e.target.value))}
                    min={model.start_year}
                    max={model.end_year}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => removeDebtFacility(index)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {debtFacilities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No debt facilities added. Click "Add Debt Facility" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pre-Purchase Agreements */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Handshake className="h-5 w-5" />
                Pre-Purchase Agreements
              </CardTitle>
              <CardDescription>
                Forward sales contracts with advance payments from buyers
              </CardDescription>
            </div>
            <Button onClick={addPrePurchaseAgreement} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Agreement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prePurchaseAgreements.map((agreement, index) => (
              <div key={index} className="grid gap-4 md:grid-cols-6 p-4 border rounded-lg">
                <div>
                  <Label>Buyer Name</Label>
                  <Input
                    value={agreement.buyer}
                    onChange={(e) => updatePrePurchaseAgreement(index, 'buyer', e.target.value)}
                    placeholder="Corporate Buyer"
                  />
                </div>
                <div>
                  <Label>Credits Quantity</Label>
                  <Input
                    type="number"
                    value={agreement.credits_quantity}
                    onChange={(e) => updatePrePurchaseAgreement(index, 'credits_quantity', Number(e.target.value))}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <Label>Price/Credit (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={agreement.price_per_credit}
                    onChange={(e) => updatePrePurchaseAgreement(index, 'price_per_credit', Number(e.target.value))}
                    placeholder="10.00"
                    min="0"
                  />
                </div>
                <div>
                  <Label>Advance Payment</Label>
                  <Input
                    type="number"
                    value={agreement.advance_payment}
                    onChange={(e) => updatePrePurchaseAgreement(index, 'advance_payment', Number(e.target.value))}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <Label>Delivery Year</Label>
                  <Input
                    type="number"
                    value={agreement.delivery_year}
                    onChange={(e) => updatePrePurchaseAgreement(index, 'delivery_year', Number(e.target.value))}
                    min={model.start_year}
                    max={model.end_year}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => removePrePurchaseAgreement(index)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {prePurchaseAgreements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No pre-purchase agreements added. Click "Add Agreement" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
          <CardDescription>
            Any additional details about your financing strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Financing conditions, milestones, warrant coverage, board composition..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveFinancingStrategy} 
          disabled={loading}
          className="bg-trust hover:bg-trust/90"
        >
          {loading ? 'Saving...' : 'Save Financing Strategy'}
        </Button>
      </div>
    </div>
  );
};

export default FinancingForm;