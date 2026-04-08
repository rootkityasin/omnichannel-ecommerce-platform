"use server";

import { getCustomerDatasets } from "@/app/actions/user";

export async function fetchCustomerDatasets() {
  return getCustomerDatasets();
}
