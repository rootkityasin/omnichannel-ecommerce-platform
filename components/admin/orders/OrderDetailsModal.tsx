"use client";

import { X, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type AdminOrder, type AdminOrderDetails } from "@/types/common";

type Props = {
  selectedOrderId: string | null;
  selectedOrderDetails: AdminOrderDetails | null;
  isDetailsLoading: boolean;
  closeOrderDetails: () => void;
  getStatusColor: (status: string) => string;
  handleEditFromDetails: (order: AdminOrderDetails) => void;
};

export default function OrderDetailsModal({
  selectedOrderId,
  selectedOrderDetails,
  isDetailsLoading,
  closeOrderDetails,
  getStatusColor,
  handleEditFromDetails,
}: Props) {
  if (!selectedOrderId) return null;

  return (
    <div
      className="fixed -inset-px z-[60000] bg-black/80 p-2 backdrop-blur-lg backdrop-brightness-50 sm:p-4"
      onClick={closeOrderDetails}
    >
      <div className="flex h-full min-h-full items-start justify-center sm:items-center">
        <Card
          className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Order Details
                </p>
                <h2 className="mt-1 break-words text-lg font-bold text-slate-900">
                  {selectedOrderDetails?.id || "Loading..."}
                </h2>
              </div>
              <button
                onClick={closeOrderDetails}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:bg-red-600 hover:scale-110 hover:shadow-red-500/40 active:scale-95"
                aria-label="Close order details"
              >
                <X className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain popup-scrollbar bg-slate-50 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-4 sm:pb-4">
            {isDetailsLoading || !selectedOrderDetails ? (
              <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
                Loading order details...
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                        Customer & Delivery
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2 text-sm">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-400">
                            Customer
                          </div>
                          <div className="mt-1 font-medium text-slate-900">
                            {selectedOrderDetails.customer}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-400">
                            Phone
                          </div>
                          <div className="mt-1 font-medium text-slate-900">
                            {selectedOrderDetails.phone}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-400">
                            Email
                          </div>
                          <div className="mt-1 font-medium text-slate-900 break-all">
                            {selectedOrderDetails.email || "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-400">
                            Area
                          </div>
                          <div className="mt-1 font-medium text-slate-900">
                            {selectedOrderDetails.area || "N/A"}
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <div className="text-xs uppercase tracking-wide text-slate-400">
                            Full Address
                          </div>
                          <div className="mt-1 rounded-xl bg-slate-50 p-3 font-medium text-slate-900 whitespace-pre-line">
                            {selectedOrderDetails.address}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                        Ordered Items
                      </h3>
                      <div className="space-y-2">
                        {selectedOrderDetails.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-slate-900 break-words">
                                {item.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                Qty: {item.quantity}
                              </div>
                            </div>
                            <div className="w-full text-left font-bold text-slate-900 sm:w-auto sm:text-right">
                              ৳{item.price}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="p-4 space-y-3 text-sm">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                        Payment & Status
                      </h3>
                      <div className="grid gap-3">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <span className="text-slate-500">Status</span>
                          <Badge
                            className={cn(
                              "font-normal",
                              getStatusColor(selectedOrderDetails.status),
                            )}
                          >
                            {selectedOrderDetails.status}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <span className="text-slate-500">Source</span>
                          <Badge
                            variant="secondary"
                            className="bg-slate-800 text-white hover:bg-slate-700"
                          >
                            {selectedOrderDetails.source}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <span className="text-slate-500">Payment Method</span>
                          <span className="w-full font-medium text-slate-900 sm:w-auto sm:text-right">
                            {selectedOrderDetails.paymentMethod || "COD"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <span className="text-slate-500">Coupon</span>
                          <span className="w-full font-medium text-slate-900 break-all sm:w-auto sm:text-right">
                            {selectedOrderDetails.couponCode || "N/A"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <span className="text-slate-500">Discount</span>
                          <span className="w-full font-medium text-slate-900 sm:w-auto sm:text-right">
                            ৳{selectedOrderDetails.discountAmount || 0}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <span className="text-slate-500">Transaction ID</span>
                          <span className="w-full font-medium text-slate-900 break-all sm:w-auto sm:text-right">
                            {selectedOrderDetails.transactionId || "N/A"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <span className="text-slate-500">Invoice State</span>
                          <span
                            className={cn(
                              "w-full font-medium sm:w-auto sm:text-right",
                              selectedOrderDetails.stockDeducted
                                ? "text-green-600"
                                : "text-slate-900",
                            )}
                          >
                            {selectedOrderDetails.stockDeducted
                              ? "Printed / Stock Deducted"
                              : "Not Printed"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <span className="text-slate-500">Total</span>
                          <span className="w-full text-lg font-black text-slate-900 sm:w-auto sm:text-right">
                            ৳{selectedOrderDetails.price}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                        Quick Actions
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            handleEditFromDetails(selectedOrderDetails)
                          }
                        >
                          <Edit className="mr-2 h-4 w-4" /> Edit Order
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
