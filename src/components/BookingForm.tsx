import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { apiService, type OptionData, type ExpenseData, type DonorData } from '@/services/api';

const bookingSchema = z.object({
  date: z.date({ required_error: 'Date is required' }),
  fromDepartment: z.string().min(1, 'From Department is required'),
  toDepartment: z.string().min(1, 'To Department is required'),
  personalAccount: z.string().optional(),
  donorDetails: z.string().optional(),
  category: z.string().optional(),
  item: z.string().optional(),
  detail: z.string().optional(),
  particulars: z.string().min(1, 'Particulars is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function BookingForm() {
  const [options, setOptions] = useState<OptionData[]>([]);
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [donors, setDonors] = useState<DonorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      date: new Date(),
      particulars: '',
      amount: 0,
    },
  });

  const watchedValues = form.watch();
  const { fromDepartment, toDepartment, item } = watchedValues;

  // Generate random ID
  const generateId = () => {
    return Math.random().toString(36).substr(2, 8);
  };

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [optionsRes, expensesRes, donorsRes] = await Promise.all([
          apiService.getOptions(),
          apiService.getExpenses(),
          apiService.getDonors(),
        ]);

        if (optionsRes.success && optionsRes.data) {
          setOptions(optionsRes.data);
        }
        if (expensesRes.success && expensesRes.data) {
          setExpenses(expensesRes.data);
        }
        if (donorsRes.success && donorsRes.data) {
          setDonors(donorsRes.data);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load data from server',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Get unique values from options
  const getUniqueOptions = useCallback((field: keyof OptionData) => {
    return [...new Set(options.map(opt => opt[field]).filter(Boolean))];
  }, [options]);

  // Get filtered categories
  const getFilteredCategories = useCallback(() => {
    return options
      .filter(opt => opt.Department === 'Books Dasosmi' && opt.Type === 'Expense')
      .map(opt => opt.Category)
      .filter(Boolean);
  }, [options]);

  // Get details based on selected item
  const getDetailsForItem = useCallback((selectedItem: string) => {
    return expenses
      .filter(exp => exp.Items === selectedItem)
      .map(exp => exp.Details)
      .filter(Boolean);
  }, [expenses]);

  // Conditional field visibility
  const showCategory = fromDepartment === 'Books-Dasosmi';
  const showItemsDetails = fromDepartment === 'Expenses-Dasosmi';
  const showDonorDetails = fromDepartment === 'Dasosmi' || fromDepartment === 'Corporate Dasosmi';
  const showPersonalAccount = toDepartment === 'Personal Account';

  const onSubmit = async (data: BookingFormData) => {
    setSubmitting(true);
    try {
      const bookingData = {
        id: generateId(),
        date: format(data.date, 'yyyy-MM-dd'),
        fromDepartment: data.fromDepartment,
        toDepartment: data.toDepartment,
        personalAccount: data.personalAccount || '',
        donorDetails: data.donorDetails || '',
        category: data.category || '',
        item: data.item || '',
        detail: data.detail || '',
        particulars: data.particulars,
        amount: data.amount,
      };

      const result = await apiService.saveBooking(bookingData);

      if (result.success) {
        toast({
          title: 'Success',
          description: `Booking saved successfully with ID: ${bookingData.id}`,
        });
        form.reset({
          date: new Date(),
          particulars: '',
          amount: 0,
        });
      } else {
        throw new Error(result.message || 'Failed to save booking');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save booking',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Date Field */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* From Department */}
              <FormField
                control={form.control}
                name="fromDepartment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select from department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover">
                        {getUniqueOptions('From Department').map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* To Department */}
              <FormField
                control={form.control}
                name="toDepartment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select to department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover">
                        {getUniqueOptions('To Department').map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Personal Account Details - Conditional */}
              {showPersonalAccount && (
                <FormField
                  control={form.control}
                  name="personalAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Account Details</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select personal account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover">
                          {getUniqueOptions('Personal Account Details').map((account) => (
                            <SelectItem key={account} value={account}>
                              {account}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Donor Details - Conditional */}
              {showDonorDetails && (
                <FormField
                  control={form.control}
                  name="donorDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Donor Details</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select donor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover">
                          {donors.map((donor) => (
                            <SelectItem key={donor['Donor ID']} value={donor['Donor ID']}>
                              {`${donor['Donor Name']} - ${donor['Mobile No.']} - ${donor.Address}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Category - Conditional */}
              {showCategory && (
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover">
                          {getFilteredCategories().map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Items - Conditional */}
              {showItemsDetails && (
                <FormField
                  control={form.control}
                  name="item"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Items</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover">
                          {[...new Set(expenses.map(exp => exp.Items).filter(Boolean))].map((itemName) => (
                            <SelectItem key={itemName} value={itemName}>
                              {itemName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Details - Conditional and Dependent */}
              {showItemsDetails && item && (
                <FormField
                  control={form.control}
                  name="detail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select detail" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover">
                          {getDetailsForItem(item).map((detail) => (
                            <SelectItem key={detail} value={detail}>
                              {detail}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Particulars */}
              <FormField
                control={form.control}
                name="particulars"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Particulars</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter particulars description..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Booking'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}