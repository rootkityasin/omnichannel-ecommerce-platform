'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Package, ClipboardList } from "lucide-react";
import { StockList } from "./StockList";
import { ExpenseList } from "./ExpenseList";
import { AddExpenseForm } from "./AddExpenseForm";
import { ExpenseExport } from "./ExpenseExport";

import { AdminProduct, Expense, StockProduct } from "@/types/common";

interface InventoryTabsProps {
    stats: {
        stockValue: number;
        totalSales: number;
        totalExpenses: number;
        netProfit: number;
    };
    expenses: Expense[];
    products: StockProduct[];
}

export function InventoryTabs({ stats, expenses, products }: Readonly<InventoryTabsProps>) {
    return (
        <div className="space-y-6">
            {/* Stats Overview - Always Visible */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Stock Value</CardTitle>
                        <Package className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">৳{stats.stockValue.toLocaleString()}</div>
                        <p className="text-xs text-slate-500 mt-1">Based on current pieces * price</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Sales</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">৳{stats.totalSales.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">৳{stats.totalExpenses.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Net Profit</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.netProfit >= 0 ? '+' : ''}৳{stats.netProfit.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="stock" className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                        <TabsTrigger value="stock">Stock Management</TabsTrigger>
                        <TabsTrigger value="expenses">Expense Tracker</TabsTrigger>
                    </TabsList>
                </div>

                {/* --- STOCK TAB --- */}
                <TabsContent value="stock" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-600" />
                                Manage Product Stock
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StockList products={products} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- EXPENSES TAB --- */}
                <TabsContent value="expenses" className="space-y-6">
                    <div className="flex justify-end">
                        <ExpenseExport expenses={expenses} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Revenue & Expense History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ExpenseList expenses={expenses} />
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-6">
                            <Card className="bg-slate-50 border-slate-200">
                                <CardHeader>
                                    <CardTitle>Record Expense</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <AddExpenseForm />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
