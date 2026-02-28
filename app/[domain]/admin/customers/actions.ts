"use server";

import { getCustomers } from "@/app/actions/user";

export async function fetchCustomers() {
  return getCustomers();
}
