"use server";

import { getAdminOrders } from "@/app/actions/order";

export async function fetchAdminOrders() {
  return getAdminOrders();
}
