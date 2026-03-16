import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  Wallet,
  ArrowRight,
  MoreVertical,
  Printer,
  Edit,
  Ban,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { AdminOrder } from "@/types/common";

interface FulfillmentBoardProps {
  orders: AdminOrder[];
  onStatusChange: (id: string, newStatus: string) => void;
  onPrint?: (id: string) => void;
  onEdit?: (order: AdminOrder) => void;
  onMarkAsFake?: (order: AdminOrder) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

export function FulfillmentBoard({
  orders,
  onStatusChange,
  onPrint,
  onEdit,
  onMarkAsFake,
  onDelete,
  readOnly,
}: FulfillmentBoardProps) {
  const columns = [
    {
      title: "Placed",
      status: "Placed",
      icon: Clock,
      color: "bg-gray-100 text-gray-500",
    },
    {
      title: "Confirmed",
      status: "Confirmed",
      icon: Package,
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      title: "Ready",
      status: "Ready",
      icon: CheckCircle,
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: "Delivered",
      status: "Delivered",
      icon: Truck,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Payment Received",
      status: "Payment Received",
      icon: Wallet,
      color: "bg-green-100 text-green-600",
    },
  ];

  const getNextStatus = (current: string) => {
    if (current === "Placed") return "Confirmed";
    if (current === "Confirmed") return "Ready";
    if (current === "Invoice Printed") return "Delivered";
    if (current === "Delivered") return "Payment Received";
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-200px)] overflow-x-auto pb-4">
      {columns.map((col) => (
        <div
          key={col.status}
          className="flex flex-col h-full bg-gray-50/50 rounded-xl border border-gray-100 min-w-[280px]"
        >
          <div
            className={`p-3 border-b border-gray-100 font-bold flex items-center gap-2 ${col.color.replace("bg-", "text-")}`}
          >
            <col.icon className="w-4 h-4" />
            {col.title}
            <Badge
              variant="outline"
              className="ml-auto bg-white shadow-sm border-none"
            >
              {orders.filter((o) => o.status === col.status).length}
            </Badge>
          </div>

          <div className="p-2 space-y-2 flex-1 overflow-y-auto">
            {orders
              .filter((o) => o.status === col.status)
              .map((order) => (
                <Card
                  key={order.id}
                  className={`p-3 cursor-pointer hover:shadow-md transition-shadow group ${order.status === "Confirmed" && col.status === "Placed" ? "border-l-4 border-l-green-500" : ""}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800">{order.id}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">
                        {order.date || "Now"}
                      </span>
                      {!readOnly &&
                        (onPrint || onEdit || onMarkAsFake || onDelete) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-slate-300 hover:text-slate-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>
                                Order Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {onPrint && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onPrint(order.id);
                                  }}
                                  disabled={
                                    order.status !== "Ready" &&
                                    order.status !== "Invoice Printed"
                                  }
                                >
                                  <Printer className="w-4 h-4 mr-2" /> Print
                                  Invoice
                                </DropdownMenuItem>
                              )}
                              {onEdit && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(order);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" /> Edit Order
                                </DropdownMenuItem>
                              )}
                              {onMarkAsFake && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsFake(order);
                                  }}
                                >
                                  <Ban className="w-4 h-4 mr-2" /> Mark as Fake
                                </DropdownMenuItem>
                              )}
                              {onDelete && (
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(order.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                  Order
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    {order.items} items • {order.customer}
                  </p>

                  {/* Quick Actions */}
                  {!readOnly && (
                    <div className="flex gap-2">
                      {getNextStatus(order.status) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full h-7 text-xs bg-white border border-gray-100 shadow-sm hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(
                              order.id,
                              getNextStatus(order.status) as string,
                            );
                          }}
                        >
                          {order.status === "Placed" ? "Confirm" : "Next"}{" "}
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            {orders.filter((o) => {
              return o.status === col.status;
            }).length === 0 && (
              <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400">
                No Orders
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
