'use client';

import { useState, useEffect } from 'react';
import { getDeliveryConfig, updateDeliveryConfig } from '@/app/actions/settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft, Trash2, Plus, AlertCircle, Check, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DISTRICTS = [
    "Bagerhat", "Bandarban", "Barguna", "Barisal", "Bhola", "Bogura", "Brahmanbaria", "Chandpur", "Chittagong", "Chuadanga", "Comilla", "Cox's Bazar",
    "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", "Jessore", "Jhalokati", "Jhenaidah",
    "Joypurhat", "Khagrachari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur", "Lalmonirhat", "Madaripur", "Magura", "Manikganj",
    "Meherpur", "Moulvibazar", "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi", "Natore", "Netrokona", "Nilphamari",
    "Noakhali", "Pabna", "Panchagarh", "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur", "Satkhira", "Shariatpur",
    "Sherpur", "Sirajganj", "Sunamganj", "Sylhet", "Tangail", "Thakurgaon"
].sort();

// All 495 Upazilas of Bangladesh organized alphabetically
const UPAZILAS = [
    "Abhaynagar", "Adamdighi", "Aditmari", "Agailjhara", "Ajmiriganj", "Akhaura", "Akkelpur", "Alamdanga", "Alfadanga", "Alikadam",
    "Anowara", "Araihazar", "Ashuganj", "Atgharia", "Atpara", "Austagram", "Babuganj", "Badarganj", "Badda", "Bagerhat Sadar",
    "Bagha", "Baghaichhari", "Bagmara", "Bahirbazar", "Bajitpur", "Bakerganj", "Bakshiganj", "Baliakandi", "Banani", "Bancharampur",
    "Bandarban Sadar", "Baniachang", "Banshkhali", "Baraigram", "Barchana", "Barguna Sadar", "Barisal Sadar", "Barkal", "Barlekha",
    "Barura", "Basail", "Batiaghata", "Bauphal", "Begumganj", "Belabo", "Belkuchi", "Betagi", "Bhairab", "Bhaluka", "Bhandaria",
    "Bhanga", "Bheramara", "Bhola Sadar", "Bholahat", "Bhurungamari", "Bijoynagar", "Birampur", "Birganj", "Bishwamvarpur", "Bishwanath",
    "Boalkhali", "Boalmari", "Bogura Sadar", "Bochaganj", "Borhanuddin", "Brahmanbaria Sadar", "Burichang", "Cantonment", "Chagalnaiya",
    "Chakaria", "Chandanaish", "Chandina", "Chandpur Sadar", "Chapainawabganj Sadar", "Charbhadrasan", "Charfashion", "Chatkhil", "Chatmohar",
    "Chauddagram", "Chhagalnaiya", "Charghat", "Chitalmari", "Chittagong Port", "Chuadanga Sadar", "Chunarughat", "Companiganj", "Cox's Bazar Sadar",
    "Daganbhuiyan", "Dagonbhuiyan", "Dakkhin Surma", "Damurhuda", "Dashmina", "Daulatpur", "Daulatkhan", "Debhata", "Debidwar", "Demra",
    "Delduar", "Dewanganj", "Dhamrai", "Dhanmondi", "Dhanbari", "Dhamoirhat", "Dharmapasha", "Dhobaura", "Dhunat", "Dhupchanchia",
    "Dighinala", "Dinajpur Sadar", "Dohar", "Domar", "Dumki", "Dumuria", "Durgapur", "Fakirhat", "Faridganj", "Faridpur Sadar",
    "Fatikchhari", "Fatulla", "Fenchuganj", "Feni Sadar", "Fulbaria", "Fulchhari", "Fulpur", "Gabtali", "Gaibandha Sadar", "Gafargaon",
    "Galachipa", "Gangachara", "Gangni", "Gaurnadi", "Gazipur Sadar", "Ghatail", "Ghior", "Goalanda", "Golapganj", "Godagari",
    "Gomastapur", "Gopalganj Sadar", "Gopalpur", "Gowainghat", "Gurudaspur", "Gulshan", "Habiganj Sadar", "Haimchar", "Hajiganj", "Hakimpur",
    "Halishahar", "Haluaghat", "Harinakundu", "Harintana", "Haripur", "Hatibandha", "Hathazari", "Hizla", "Homna", "Ishwardi",
    "Ishwarganj", "Islampur", "Itna", "Jaintiapur", "Jajira", "Jamalpur Sadar", "Jessore Sadar", "Jhalkathi Sadar", "Jhenaidah Sadar", "Jhikargacha",
    "Jibannagar", "Joypurhat Sadar", "Joynagar", "Kachua", "Kadamtali", "Kafrul", "Kahaloo", "Kalaroa", "Kalapara", "Kalai",
    "Kalia", "Kaliganj", "Kaliakair", "Kalihati", "Kalmakanda", "Kamalpur", "Kamalganj", "Kamrangirchar", "Kamarkhand", "Kanaighat",
    "Kapasia", "Karimganj", "Kasba", "Katiadi", "Kaunia", "Kawkhali", "Kendua", "Keraniganj", "Keshabpur", "Khagrachhari Sadar",
    "Khaliajuri", "Khilgaon", "Khoksa", "Khulna Sadar", "Kishoreganj Sadar", "Kolapara", "Kotalipara", "Kotchandpur", "Kulaura", "Kuliarchar",
    "Kumarkhali", "Kundaghat", "Kurigram Sadar", "Kushtia Sadar", "Kutubdia", "Laksham", "Lakshmipur Sadar", "Lalbag", "Lalmai", "Lalmohan",
    "Lalmonirhat Sadar", "Lalpur", "Langadu", "Lohagara", "Lohajang", "Madarganj", "Madaripur Sadar", "Madhabpur", "Madhukhali", "Madhupur",
    "Magura Sadar", "Maheshkhali", "Maheshpur", "Maijdee", "Manikchhari", "Manikganj Sadar", "Manirampur", "Manpura", "Matiranga", "Mawna",
    "Meghna", "Mehendiganj", "Meherpur Sadar", "Mirersarai", "Mirsharai", "Mirpur", "Mirzapur", "Mithapukur", "Modhukhali", "Mohanganj",
    "Mohammadpur", "Moheshkhali", "Monohordi", "Morrelganj", "Motijheel", "Moulvi Bazar Sadar", "Mujibnagar", "Muktagachha", "Muktagasa", "Muladi",
    "Munshiganj Sadar", "Muksudpur", "Mymensingh Sadar", "Nabinagar", "Nachol", "Nagarkanda", "Nageswari", "Nakla", "Nalchity", "Nalitabari",
    "Nandigram", "Nandail", "Naogaon Sadar", "Narail Sadar", "Narayanganj Sadar", "Narsingdi Sadar", "Natore Sadar", "Nawabganj", "Netrokona Sadar",
    "New Market", "Nilphamari Sadar", "Niyamatpur", "Noakhali Sadar", "Paba", "Pabna Sadar", "Pahartali", "Pakundia", "Palang", "Palash",
    "Pallabi", "Panchagar", "Panchagarh Sadar", "Pangsha", "Parbatipur", "Parshuram", "Patgram", "Patharghata", "Pathiya", "Patnitala",
    "Patuakhali Sadar", "Pekua", "Phulbari", "Phulpur", "Pirgachha", "Pirganj", "Pirojpur Sadar", "Porsha", "Pubail", "Purbadhala",
    "Rahanpur", "Raipur", "Raipura", "Rajbari Sadar", "Rajnagar", "Rajoir", "Rajshahi Sadar", "Ramganj", "Ramgarh", "Ramgati",
    "Ramna", "Rampal", "Ramu", "Rangamati Sadar", "Rangpur Sadar", "Ranisankail", "Raninagar", "Rangunia", "Raozan", "Rashahi",
    "Rohanpur", "Rowmari", "Rupganj", "Rupsa", "Sabang", "Sadarghat", "Sadar", "Sadarpur", "Sadullapur", "Saidpur",
    "Sakhipur", "Saltha", "Sandwip", "Santhia", "Sapahar", "Sarishabari", "Sarail", "Satkhira Sadar", "Savar", "Sayedabad",
    "Senbag", "Shahjadpur", "Shailkupa", "Shajahanpur", "Shalikha", "Shalua", "Shantiganj", "Shantinagar", "Shapahar", "Shariatpur Sadar",
    "Sherpur Sadar", "Sher-e-Bangla Nagar", "Shibchar", "Shibganj", "Shibpur", "Shimlia", "Shirajdikhan", "Shreepur", "Shreenagar", "Shyamganj",
    "Shyamnagar", "Sirajganj Sadar", "Sitakunda", "Sonagazi", "Sonadanga", "Sonargaon", "Sonatala", "Sreepur", "Sreemangal", "Sreerampur",
    "Subarnachar", "Sujanagar", "Sunamganj Sadar", "Sundarganj", "Sylhet Sadar", "Tala", "Taltali", "Tanore", "Tangail Sadar", "Tarabo",
    "Tarakanda", "Tarash", "Teknaf", "Tetulia", "Thakurgaon Sadar", "Titas", "Tongibari", "Tongi", "Ullapara", "Ullahpara",
    "Ukhia", "Uttara", "Uzipur", "Ulipur", "Wazirpur", "Zakiganj", "Zanjira", "Zilha Sadar"
].sort();

export function DeliverySettings({ onBack }: { onBack?: () => void }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<any>({
        defaultCharge: 60,
        defaultCodEnabled: true,
        nonRefundable: false,
        weightBasedCharges: [],
        deliveryZones: [],
        courierPathaoEnabled: false,
        courierPathaoCredentials: null,
        courierSteadfastEnabled: false,
        courierSteadfastCredentials: null,
        courierRedxEnabled: false,
        courierRedxCredentials: null,
        courierPaperflyEnabled: false,
        courierPaperflyCredentials: null
    });

    // Combobox state
    const [openDistrict, setOpenDistrict] = useState(false);
    const [districtSearch, setDistrictSearch] = useState("");
    const [openUpazila, setOpenUpazila] = useState(false);
    const [upazilaSearch, setUpazilaSearch] = useState("");

    // Password visibility states
    const [showPathaoSecret, setShowPathaoSecret] = useState(false);
    const [showPathaoPassword, setShowPathaoPassword] = useState(false);
    const [showSteadfastApiKey, setShowSteadfastApiKey] = useState(false);
    const [showSteadfastSecret, setShowSteadfastSecret] = useState(false);
    const [showRedxApiKey, setShowRedxApiKey] = useState(false);
    const [showPaperflyUsername, setShowPaperflyUsername] = useState(false);
    const [showPaperflyPassword, setShowPaperflyPassword] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        const data = await getDeliveryConfig();
        if (data) {
            setConfig(data);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const res = await updateDeliveryConfig(config);
        if (res.success) {
            toast.success("Delivery settings saved successfully");
            // Reload to ensure all states are synced if needed, mostly for IDs but we are using JSON for dynamic parts
        } else {
            toast.error("Failed to save settings");
        }
        setSaving(false);
    };

    // Weight Based Charges Handlers
    const [newWeightCharge, setNewWeightCharge] = useState({ weight: '', charge: '' });

    const addWeightCharge = () => {
        if (!newWeightCharge.weight || !newWeightCharge.charge) return;
        setConfig({
            ...config,
            weightBasedCharges: [...(config.weightBasedCharges || []), {
                min: Number(newWeightCharge.weight), // Using 'min' as per previous code, or change to 'weight' if schema allows. sticking to 'min' for now to match list below
                max: 0,
                charge: Number(newWeightCharge.charge)
            }]
        });
        setNewWeightCharge({ weight: '', charge: '' });
    };

    const updateWeightCharge = (index: number, field: string, value: any) => {
        const newCharges = [...(config.weightBasedCharges || [])];
        newCharges[index] = { ...newCharges[index], [field]: Number(value) };
        setConfig({ ...config, weightBasedCharges: newCharges });
    };

    const removeWeightCharge = (index: number) => {
        const newCharges = [...(config.weightBasedCharges || [])];
        newCharges.splice(index, 1);
        setConfig({ ...config, weightBasedCharges: newCharges });
    };

    // Zone Handlers
    const [newZone, setNewZone] = useState({ name: '', price: 0, type: 'DISTRICT' });

    const addZone = () => {
        if (!newZone.name) return toast.error("Name is required");
        setConfig({
            ...config,
            deliveryZones: [...(config.deliveryZones || []), {
                id: crypto.randomUUID(),
                name: newZone.name,
                price: Number(newZone.price),
                type: newZone.type,
                codEnabled: true
            }]
        });
        setNewZone({ ...newZone, name: '', price: 0 });
    };

    const removeZone = (id: string) => {
        setConfig({
            ...config,
            deliveryZones: (config.deliveryZones || []).filter((z: any) => z.id !== id)
        });
    };

    const toggleZoneCod = (id: string, val: boolean) => {
        setConfig({
            ...config,
            deliveryZones: (config.deliveryZones || []).map((z: any) =>
                z.id === id ? { ...z, codEnabled: val } : z
            )
        });
    };


    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

    const zones = (config.deliveryZones || []).filter((z: any) => z.type === 'ZONE');
    const districts = (config.deliveryZones || []).filter((z: any) => z.type === 'DISTRICT');
    const upazilas = (config.deliveryZones || []).filter((z: any) => z.type === 'UPAZILA');

    const filteredDistricts = DISTRICTS.filter(d => d.toLowerCase().includes(districtSearch.toLowerCase()));
    const filteredUpazilas = UPAZILAS.filter(u => u.toLowerCase().includes(upazilaSearch.toLowerCase()));

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header / Banner */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </Button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Delivery Support</h2>
                        <p className="text-sm text-slate-500">Configure your delivery charges and zones</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes or Update
                </Button>
            </div>



            {/* Default Service Config */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Delivery Service</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Default Charge */}
                    <div className="space-y-2">
                        <Label>Delivery Charge (Default)</Label>
                        <Input
                            type="number"
                            value={config.defaultCharge}
                            onChange={(e) => setConfig({ ...config, defaultCharge: e.target.value })}
                        />
                        <p className="text-xs text-slate-400">Default delivery charge will be applied to all areas, except for the specific zones listed below.</p>
                    </div>

                    {/* Default COD */}
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <Label>Enable COD for Default Delivery</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-600">[{config.defaultCodEnabled ? 'YES' : 'NO'}]</span>
                            <Switch
                                checked={config.defaultCodEnabled}
                                onCheckedChange={(c) => setConfig({ ...config, defaultCodEnabled: c })}
                            />
                        </div>
                    </div>

                    {/* Non Refundable */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-slate-800">Delivery Charge not refundable?</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-600">[{config.nonRefundable ? 'YES' : 'NO'}]</span>
                                <Switch
                                    checked={config.nonRefundable}
                                    onCheckedChange={(c) => setConfig({ ...config, nonRefundable: c })}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">Enabling this option ensures if you return a order the delivery charge will not be refunded.</p>
                    </div>

                    {/* Weight Based Charges */}
                    <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-1">
                            <Label>Weight-Based Extra Charges</Label>
                            <p className="text-xs text-slate-400">Add extra delivery charges based on product weight. For example: 5 kg = ৳50, 10 kg = ৳80</p>
                        </div>

                        {config.weightBasedCharges?.map((item: any, i: number) => (
                            <div key={i} className="flex gap-4 items-center animate-in fade-in slide-in-from-left-2">
                                <div className="grid grid-cols-2 gap-4 flex-1">
                                    <Input
                                        placeholder="Weight (kg)"
                                        type="number"
                                        value={item.min || ''}
                                        onChange={(e) => updateWeightCharge(i, 'min', e.target.value)}
                                    />
                                    <Input
                                        placeholder="Extra Charge"
                                        type="number"
                                        value={item.charge || ''}
                                        onChange={(e) => updateWeightCharge(i, 'charge', e.target.value)}
                                    />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeWeightCharge(i)} className="text-red-500 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}

                        <div className="flex gap-4 items-center">
                            <div className="grid grid-cols-2 gap-4 flex-1">
                                <Input
                                    placeholder="Weight (in kg)"
                                    type="number"
                                    value={newWeightCharge.weight}
                                    onChange={(e) => setNewWeightCharge({ ...newWeightCharge, weight: e.target.value })}
                                />
                                <Input
                                    placeholder="Extra Charge"
                                    type="number"
                                    value={newWeightCharge.charge}
                                    onChange={(e) => setNewWeightCharge({ ...newWeightCharge, charge: e.target.value })}
                                />
                            </div>
                            <Button
                                variant="secondary"
                                onClick={addWeightCharge}
                                className="w-24"
                                disabled={!newWeightCharge.weight || !newWeightCharge.charge}
                            >
                                Add <Plus className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>

                    {/* Specific Zones */}
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <Label>Delivery option:</Label>
                            <Tabs value={newZone.type} onValueChange={(v) => setNewZone({ ...newZone, type: v })} className="w-auto">
                                <TabsList>
                                    <TabsTrigger value="ZONE">Zones</TabsTrigger>
                                    <TabsTrigger value="DISTRICT">Districts</TabsTrigger>
                                    <TabsTrigger value="UPAZILA">Upazila/P.S</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div className="space-y-2">
                            <Label>Specific Delivery Charges</Label>

                            {/* List of active zones for current selected type */}
                            <div className="space-y-3">
                                {(newZone.type === 'ZONE' ? zones : newZone.type === 'DISTRICT' ? districts : upazilas).map((z: any) => (
                                    <div key={z.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3 animate-in fade-in">
                                        <div className="flex gap-3">
                                            <Input value={z.name} readOnly className="flex-1 bg-white" />
                                            <Input value={z.price} readOnly className="w-24 bg-white" />
                                            <Button variant="destructive" size="icon" onClick={() => removeZone(z.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-sm font-medium text-slate-700">Enable COD for this zone</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500">[{z.codEnabled ? 'YES' : 'NO'}]</span>
                                                <Switch checked={z.codEnabled} onCheckedChange={(c) => toggleZoneCod(z.id, c)} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add New Zone */}
                            <div className="flex gap-3 pt-2">
                                {newZone.type === 'DISTRICT' ? (
                                    <div className="flex-1 relative">
                                        <Input
                                            placeholder="Search districts..."
                                            value={districtSearch}
                                            onChange={(e) => {
                                                setDistrictSearch(e.target.value);
                                                setOpenDistrict(true);
                                            }}
                                            onFocus={() => setOpenDistrict(true)}
                                            onBlur={() => {
                                                // Delay to allow click on dropdown items
                                                setTimeout(() => setOpenDistrict(false), 150);
                                            }}
                                            className="w-full bg-white pr-8"
                                        />
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />

                                        {/* Dropdown list */}
                                        {openDistrict && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
                                                {filteredDistricts.length === 0 ? (
                                                    <div className="px-4 py-3 text-sm text-slate-500 text-center">No district found.</div>
                                                ) : (
                                                    filteredDistricts.map((district) => {
                                                        const isSelected = newZone.name === district;
                                                        return (
                                                            <div
                                                                key={district}
                                                                className={cn(
                                                                    "px-4 py-2.5 cursor-pointer text-sm text-slate-700",
                                                                    isSelected ? "bg-blue-100" : "hover:bg-blue-50"
                                                                )}
                                                                onMouseDown={(e) => e.preventDefault()}
                                                                onClick={() => {
                                                                    setNewZone({ ...newZone, name: district });
                                                                    setDistrictSearch(district);
                                                                    setOpenDistrict(false);
                                                                }}
                                                            >
                                                                {district}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : newZone.type === 'UPAZILA' ? (
                                    <div className="flex-1 relative">
                                        <Input
                                            placeholder="Search upazilas..."
                                            value={upazilaSearch}
                                            onChange={(e) => {
                                                setUpazilaSearch(e.target.value);
                                                setOpenUpazila(true);
                                            }}
                                            onFocus={() => setOpenUpazila(true)}
                                            onBlur={() => {
                                                setTimeout(() => setOpenUpazila(false), 150);
                                            }}
                                            className="w-full bg-white pr-8"
                                        />
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />

                                        {/* Upazila Dropdown list */}
                                        {openUpazila && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
                                                {filteredUpazilas.length === 0 ? (
                                                    <div className="px-4 py-3 text-sm text-slate-500 text-center">No upazila found.</div>
                                                ) : (
                                                    filteredUpazilas.map((upazila) => {
                                                        const isSelected = newZone.name === upazila;
                                                        return (
                                                            <div
                                                                key={upazila}
                                                                className={cn(
                                                                    "px-4 py-2.5 cursor-pointer text-sm text-slate-700",
                                                                    isSelected ? "bg-blue-100" : "hover:bg-blue-50"
                                                                )}
                                                                onMouseDown={(e) => e.preventDefault()}
                                                                onClick={() => {
                                                                    setNewZone({ ...newZone, name: upazila });
                                                                    setUpazilaSearch(upazila);
                                                                    setOpenUpazila(false);
                                                                }}
                                                            >
                                                                {upazila}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Input
                                        className="flex-1"
                                        placeholder={`Enter delivery ${newZone.type.toLowerCase()}`}
                                        value={newZone.name}
                                        onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                                    />
                                )}
                                <Input
                                    className="w-24"
                                    placeholder="Price"
                                    type="number"
                                    value={newZone.price || ''}
                                    onChange={(e) => setNewZone({ ...newZone, price: parseInt(e.target.value) || 0 })}
                                />
                                <Button variant="secondary" onClick={addZone} className="w-24">
                                    Add <Plus className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">Update Delivery Charges</Button>
                    </div>

                </CardContent>
            </Card>

            {/* Courier Services */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800">Courier Services</h3>
                <p className="text-sm text-slate-500">Enable and configure your preferred delivery services</p>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                                <img src="/images/pathao.png" alt="Pathao" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Pathao</CardTitle>
                                <CardDescription>Configure delivery credentials</CardDescription>
                            </div>
                        </div>
                        <Switch
                            checked={config.courierPathaoEnabled}
                            onCheckedChange={(c) => setConfig({ ...config, courierPathaoEnabled: c })}
                        />
                    </CardHeader>
                    {config.courierPathaoEnabled && (
                        <CardContent className="p-6 border-t bg-white">
                            {/* Pathao Header */}
                            <div className="flex items-center gap-2 mb-2">
                                <img src="/images/pathao.png" alt="Pathao" className="h-6 object-contain" />
                                <span className="text-slate-400">|</span>
                                <span className="font-semibold text-slate-800">Configure Pathao</span>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">Please provide your Pathao credentials to integrate Pathao</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    placeholder="Store ID"
                                    value={config.courierPathaoCredentials?.store_id || ''}
                                    onChange={(e) => setConfig({ ...config, courierPathaoCredentials: { ...config.courierPathaoCredentials, store_id: e.target.value } })}
                                />
                                <Input
                                    placeholder="Client ID"
                                    value={config.courierPathaoCredentials?.client_id || ''}
                                    onChange={(e) => setConfig({ ...config, courierPathaoCredentials: { ...config.courierPathaoCredentials, client_id: e.target.value } })}
                                />
                                <div className="relative">
                                    <Input
                                        type={showPathaoSecret ? "text" : "password"}
                                        placeholder="Client Secret"
                                        value={config.courierPathaoCredentials?.client_secret || ''}
                                        onChange={(e) => setConfig({ ...config, courierPathaoCredentials: { ...config.courierPathaoCredentials, client_secret: e.target.value } })}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPathaoSecret(!showPathaoSecret)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPathaoSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="relative">
                                    <Input
                                        type={showPathaoPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={config.courierPathaoCredentials?.password || ''}
                                        onChange={(e) => setConfig({ ...config, courierPathaoCredentials: { ...config.courierPathaoCredentials, password: e.target.value } })}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPathaoPassword(!showPathaoPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPathaoPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <Input
                                    placeholder="Username"
                                    value={config.courierPathaoCredentials?.username || ''}
                                    onChange={(e) => setConfig({ ...config, courierPathaoCredentials: { ...config.courierPathaoCredentials, username: e.target.value } })}
                                />
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    Add <Plus className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Steadfast Courier */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                                <img src="/images/steadfast.png" alt="Steadfast" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Steadfast</CardTitle>
                                <CardDescription>Configure delivery credentials</CardDescription>
                            </div>
                        </div>
                        <Switch
                            checked={config.courierSteadfastEnabled}
                            onCheckedChange={(c) => setConfig({ ...config, courierSteadfastEnabled: c })}
                        />
                    </CardHeader>
                    {config.courierSteadfastEnabled && (
                        <CardContent className="p-6 border-t bg-white">
                            {/* Steadfast Header */}
                            <div className="flex items-center gap-2 mb-2">
                                <img src="/images/steadfast.png" alt="Steadfast" className="h-6 object-contain" />
                                <span className="text-slate-400">|</span>
                                <span className="font-semibold text-slate-800">Configure Steadfast</span>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">Please provide your Steadfast credentials to integrate Steadfast</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <Input
                                        type={showSteadfastApiKey ? "text" : "password"}
                                        placeholder="API key"
                                        value={config.courierSteadfastCredentials?.api_key || ''}
                                        onChange={(e) => setConfig({ ...config, courierSteadfastCredentials: { ...config.courierSteadfastCredentials, api_key: e.target.value } })}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSteadfastApiKey(!showSteadfastApiKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showSteadfastApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="relative">
                                    <Input
                                        type={showSteadfastSecret ? "text" : "password"}
                                        placeholder="App Secret"
                                        value={config.courierSteadfastCredentials?.app_secret || ''}
                                        onChange={(e) => setConfig({ ...config, courierSteadfastCredentials: { ...config.courierSteadfastCredentials, app_secret: e.target.value } })}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSteadfastSecret(!showSteadfastSecret)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showSteadfastSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    Add <Plus className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Redx Courier */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                                <img src="/images/redx_logo.png" alt="Redx" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Redx</CardTitle>
                                <CardDescription>Configure delivery credentials</CardDescription>
                            </div>
                        </div>
                        <Switch
                            checked={config.courierRedxEnabled}
                            onCheckedChange={(c) => setConfig({ ...config, courierRedxEnabled: c })}
                        />
                    </CardHeader>
                    {config.courierRedxEnabled && (
                        <CardContent className="p-6 border-t bg-white">
                            {/* Redx Header */}
                            <div className="flex items-center gap-2 mb-2">
                                <img src="/images/redx_logo.png" alt="Redx" className="h-6 object-contain" />
                                <span className="text-slate-400">|</span>
                                <span className="font-semibold text-slate-800">Configure Redx</span>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">Please provide your Redx credentials to integrate Redx</p>

                            <div className="relative">
                                <Input
                                    type={showRedxApiKey ? "text" : "password"}
                                    placeholder="API key"
                                    value={config.courierRedxCredentials?.api_key || ''}
                                    onChange={(e) => setConfig({ ...config, courierRedxCredentials: { ...config.courierRedxCredentials, api_key: e.target.value } })}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowRedxApiKey(!showRedxApiKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showRedxApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    Add <Plus className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Paperfly Courier */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                                <img src="/images/paperfly.png" alt="Paperfly" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Paperfly</CardTitle>
                                <CardDescription>Configure delivery credentials</CardDescription>
                            </div>
                        </div>
                        <Switch
                            checked={config.courierPaperflyEnabled}
                            onCheckedChange={(c) => setConfig({ ...config, courierPaperflyEnabled: c })}
                        />
                    </CardHeader>
                    {config.courierPaperflyEnabled && (
                        <CardContent className="p-6 border-t bg-white">
                            {/* Paperfly Header */}
                            <div className="flex items-center gap-2 mb-2">
                                <img src="/images/paperfly.png" alt="Paperfly" className="h-6 object-contain" />
                                <span className="text-slate-400">|</span>
                                <span className="font-semibold text-slate-800">Configure Paperfly</span>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">Please provide your Paperfly credentials to integrate Paperfly</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <Input
                                        type={showPaperflyUsername ? "text" : "password"}
                                        placeholder="Username"
                                        value={config.courierPaperflyCredentials?.username || ''}
                                        onChange={(e) => setConfig({ ...config, courierPaperflyCredentials: { ...config.courierPaperflyCredentials, username: e.target.value } })}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPaperflyUsername(!showPaperflyUsername)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPaperflyUsername ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="relative">
                                    <Input
                                        type={showPaperflyPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={config.courierPaperflyCredentials?.password || ''}
                                        onChange={(e) => setConfig({ ...config, courierPaperflyCredentials: { ...config.courierPaperflyCredentials, password: e.target.value } })}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPaperflyPassword(!showPaperflyPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPaperflyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    Add <Plus className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    );
}

