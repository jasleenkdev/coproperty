import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PropertyTokenModule", (m) => {
  const propertyToken = m.contract("PropertyToken", [
    "Property A Token",
    "PROP_A",
    1,
    m.getAccount(0),
  ]);

  return { propertyToken };
});