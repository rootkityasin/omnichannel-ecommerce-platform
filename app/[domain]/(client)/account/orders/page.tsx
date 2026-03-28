import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMyOrders } from "@/app/actions/order";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function getStatusColor(status: string) {
  switch (status) {
    case "Placed":
      return "bg-blue-100 text-blue-700";
    case "Confirmed":
      return "bg-green-100 text-green-700";
    case "Ready":
      return "bg-purple-100 text-purple-700";
    case "Invoice Printed":
      return "bg-teal-100 text-teal-700";
    case "Delivered":
      return "bg-emerald-100 text-emerald-700";
    case "Payment Received":
      return "bg-green-600 text-white";
    case "Payment OnProcess":
      return "bg-yellow-100 text-yellow-800";
    case "Payment Failed":
      return "bg-red-100 text-red-700";
    case "Returned":
      return "bg-orange-100 text-orange-700";
    case "Cancelled":
      return "bg-slate-200 text-slate-600";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/account");
  }

  const orders = await getMyOrders();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 pb-24 md:pb-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">
            My Orders
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your recent orders and current status.
          </p>
        </div>

        {orders.length === 0 ? (
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-8 text-center text-slate-500">
              No orders found yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="border border-gray-100 shadow-sm rounded-2xl"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">{order.id}</h3>
                      <p className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleString("en-BD", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>

                  <div className="border-t border-dashed border-gray-100 pt-3 space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 text-sm"
                      >
                        <span className="text-slate-700">
                          {item.quantity}x {item.productName}
                        </span>
                        <span className="font-medium text-slate-500">
                          ৳{item.price}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="text-sm font-semibold text-slate-500">
                      Total Bill
                    </span>
                    <span className="text-lg font-black text-crab-red font-heading">
                      ৳{order.totalAmount}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
