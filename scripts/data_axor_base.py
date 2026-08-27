# -*- coding: utf-8 -*-
# AXOR and Hansgrohe catalog parser
import re

def clean_money(s):
    if not s:
        return 0
    t = re.sub(r'[^\d]', '', str(s))
    return int(t) if t else 0

AXOR_HANSGROHE_RAW = """
AX|01005180|AXOR ubox universal|AXOR uBox universal Base set for finish sets for standard installation|Axor Basic set|9.558.000|5.257.000|n.a|DE|
AX|01006180|AXOR ubox universal|AXOR uBox universal Base set for finish sets for flat installation|Axor Basic set|9.558.000|5.257.000|n.a|DE|
AX|01007180|AXOR ubox universal|AXOR uBox universal Base set for finish sets for vertical installation|Axor Basic set|9.558.000|5.257.000|n.a|DE|
AX|01400180|iBox Universal 2|AXOR iBox universal 2 Basic set|Axor Basic Set|6.244.000|3.434.000|n.a|DE|Optional : 97998000
AX|01700180|AXOR iBox Universal|AXOR iBox universal Basic set|Axor Basic set|6.248.000|3.436.000|n.a|DE|01700180 Last order date 30.06.2027
AX|10001000|AXOR Starck|AXOR Starck Single lever basin mixer 100 with lever handle and pop-up waste set|1-hole basin mixer|16.206.000|8.913.000|Chrome|DE|
AX|10001XXX|AXOR Starck|AXOR Starck Single lever basin mixer 100 with lever handle and pop-up waste set|1-hole basin mixer|24.307.000|13.369.000|Special Finishes|DE|Stock keeping finish 340 & 800
AX|10003000|AXOR Starck|AXOR Starck Single lever basin mixer 100 with lever handle and waste set|1-hole basin mixer|16.206.000|8.913.000|Chrome|DE|
AX|10003XXX|AXOR Starck|AXOR Starck Single lever basin mixer 100 with lever handle and waste set|1-hole basin mixer|24.307.000|13.369.000|Special Finishes|DE|Stock keeping finish 340 & 800
AX|10007000|AXOR Starck|AXOR Starck Single lever basin mixer 100 CoolStart with lever handle and pop-up waste set|1-hole basin mixer|16.206.000|8.913.000|Chrome|DE|
AX|10007XXX|AXOR Starck|AXOR Starck Single lever basin mixer 100 CoolStart with lever handle and pop-up waste set|1-hole basin mixer|24.307.000|13.369.000|Special Finishes|DE|Stock keeping finish 340 & 800
AX|10010000|AXOR Starck|AXOR Starck Classic Single lever basin mixer 70 with pop-up waste set|1-hole basin mixer|29.536.000|16.245.000|Chrome|DE|
AX|10010XXX|AXOR Starck|AXOR Starck Classic Single lever basin mixer 70 with pop-up waste set|1-hole basin mixer|44.304.000|24.367.000|Special Finishes|DE|
AX|10018000|AXOR Starck|AXOR Starck Classic Single lever basin mixer 70 with waste set|1-hole basin mixer|29.536.000|16.245.000|Chrome|DE|
AX|10018XXX|AXOR Starck|AXOR Starck Classic Single lever basin mixer 70 with waste set|1-hole basin mixer|44.304.000|24.367.000|Special Finishes|DE|
AX|10030000|AXOR Starck|AXOR Starck 2-handle basin mixer 80 with pop-up waste set|2-handle basin mixer|36.293.000|19.961.000|Chrome|DE|Phase out 2026
AX|10030XXX|AXOR Starck|AXOR Starck 2-handle basin mixer 80 with pop-up waste set|2-handle basin mixer|54.443.000|29.944.000|Special Finishes|DE|Phase out 2026
AX|10101000|AXOR Starck|AXOR Starck Electronic basin mixer with temperature control battery-operated|E-Faucets|51.731.000|28.452.000|Chrome|DE|Stock keeping finish 340 & 800
AX|10101XXX|AXOR Starck|AXOR Starck Electronic basin mixer with temperature control battery-operated|E-Faucets|77.597.000|42.678.000|Special Finishes|DE|
AX|10102000|AXOR Starck|AXOR Starck Single lever basin mixer 80 with lever handle for hand wash basins with pop-up waste set|1-hole basin mixer|16.206.000|8.913.000|Chrome|DE|
AX|10102XXX|AXOR Starck|AXOR Starck Single lever basin mixer 80 with lever handle for hand wash basins with pop-up waste set|1-hole basin mixer|24.307.000|13.369.000|Special Finishes|DE|Stock keeping finish 340 & 800
AX|10103000|AXOR Starck|AXOR Starck Single lever basin mixer 250 with lever handle for wash bowls with waste set|1-hole basin mixer|23.562.000|12.959.000|Chrome|DE|
AX|10103XXX|AXOR Starck|AXOR Starck Single lever basin mixer 250 with lever handle for wash bowls with waste set|1-hole basin mixer|35.344.000|19.439.000|Special Finishes|DE|Stock keeping finish 340 & 800
AX|10106000|AXOR Starck|AXOR Starck Electronic basin mixer with temperature pre-adjustment battery-operated|E-Faucets|47.020.000|25.861.000|Chrome|DE|
AX|10106XXX|AXOR Starck|AXOR Starck Electronic basin mixer with temperature pre-adjustment battery-operated|E-Faucets|70.528.000|38.790.000|Special Finishes|DE|Stock keeping finish 340 & 800
AX|10111000|AXOR Starck|AXOR Starck Single lever basin mixer 90 with pin handle and pop-up waste set|1-hole basin mixer|29.525.000|16.239.000|Chrome|DE|
AX|10111XXX|AXOR Starck|AXOR Starck Single lever basin mixer 90 with pin handle and pop-up waste set|1-hole basin mixer|44.290.000|24.360.000|Special Finishes|DE|Stock keeping finish 340
AX|10116000|AXOR Starck|AXOR Starck Single lever basin mixer 70 with pin handle for hand wash basins with pop-up waste set|1-hole basin mixer|27.535.000|15.144.000|Chrome|DE|
AX|10116XXX|AXOR Starck|AXOR Starck Single lever basin mixer 70 with pin handle for hand wash basins with pop-up waste set|1-hole basin mixer|41.303.000|22.717.000|Special Finishes|DE|Stock keeping finish 340
AX|10117000|AXOR Starck|AXOR Starck Single lever basin mixer 90 with pin handle and waste set|1-hole basin mixer|29.525.000|16.239.000|Chrome|DE|
AX|10117XXX|AXOR Starck|AXOR Starck Single lever basin mixer 90 with pin handle and waste set|1-hole basin mixer|44.290.000|24.360.000|Special Finishes|DE|Stock keeping finish 340
AX|10123000|AXOR Starck|AXOR Starck Single lever basin mixer 170 with pin handle and waste set|1-hole basin mixer|34.002.000|18.701.000|Chrome|DE|
AX|10123XXX|AXOR Starck|AXOR Starck Single lever basin mixer 170 with pin handle and waste set|1-hole basin mixer|51.002.000|28.051.000|Special Finishes|DE|
AX|10129000|AXOR Starck|AXOR Starck Single lever basin mixer 250 with pin handle for wash bowls with waste set|1-hole basin mixer|45.160.000|24.838.000|Chrome|DE|
AX|10129XXX|AXOR Starck|AXOR Starck Single lever basin mixer 250 with pin handle for wash bowls with waste set|1-hole basin mixer|67.740.000|37.257.000|Special Finishes|DE|Stock keeping finish 340
AX|10140000|AXOR Starck|AXOR Starck Electronic basin mixer with temperature control with mains connection 230 V|E-Faucets|56.900.000|31.295.000|Chrome|DE|
AX|10140XXX|AXOR Starck|AXOR Starck Electronic basin mixer with temperature control with mains connection 230 V|E-Faucets|85.349.000|46.942.000|Special Finishes|DE|Stock keeping finish 340
AX|10145000|AXOR Starck|AXOR Starck Electronic basin mixer with temperature pre-adjustment with mains connection 230 V|E-Faucets|51.731.000|28.452.000|Chrome|DE|
AX|10145XXX|AXOR Starck|AXOR Starck Electronic basin mixer with temperature pre-adjustment with mains connection 230 V|E-Faucets|77.597.000|42.678.000|Special Finishes|DE|
AX|10211000|AXOR Starck|AXOR Starck Single lever bidet mixer with pin handle and pop-up waste set|Bidet faucet|29.525.000|16.239.000|Chrome|DE|
AX|10211XXX|AXOR Starck|AXOR Starck Single lever bidet mixer with pin handle and pop-up waste set|Bidet faucet|44.290.000|24.360.000|Special Finishes|DE|
AX|10214000|AXOR Starck|AXOR Starck Single lever bidet mixer with lever handle and pop-up waste set|Bidet faucet|16.206.000|8.913.000|Chrome|DE|
AX|10214XXX|AXOR Starck|AXOR Starck Single lever bidet mixer with lever handle and pop-up waste set|Bidet faucet|24.307.000|13.369.000|Special Finishes|DE|
AX|10300000|AXOR Starck|AXOR Starck Single lever basin mixer 90 with bidette hand shower and shower hose 1.60 m|Hygiene Shower / Bidette|32.465.000|17.856.000|Chrome|DE|
AX|10300XXX|AXOR Starck|AXOR Starck Single lever basin mixer 90 with bidette hand shower and shower hose 1.60 m|Hygiene Shower / Bidette|48.700.000|26.785.000|Special Finishes|DE|Stock keeping finish 340
AX|10303180|AXOR Starck|Basic set for 3-hole basin mixer for concealed installation wall-mounted|Basic set|12.973.000|7.135.000|n.a|DE|
AX|10410000|AXOR Starck|AXOR Starck Bath spout|Bath filler|11.618.000|6.390.000|Chrome|DE|
AX|10410XXX|AXOR Starck|AXOR Starck Bath spout|Bath filler|17.426.000|9.584.000|Special Finishes|DE|Stock keeping finish 340
AX|10411000|AXOR Starck|AXOR Starck Single lever bath mixer for exposed installation with pin handle|Bath mixer wall mounted|45.377.000|24.957.000|Chrome|DE|
AX|10411XXX|AXOR Starck|AXOR Starck Single lever bath mixer for exposed installation with pin handle|Bath mixer wall mounted|68.066.000|37.436.000|Special Finishes|DE|
AX|10416000|AXOR Starck|AXOR Starck Single lever bath mixer for concealed installation with pin handle|Bath mixer concealed|19.306.000|10.618.000|Chrome|DE|
AX|10416XXX|AXOR Starck|AXOR Starck Single lever bath mixer for concealed installation with pin handle|Bath mixer concealed|28.960.000|15.928.000|Special Finishes|DE|Stock keeping finish 340
AX|10452180|AXOR Starck|Basic set for mixers floor-standing|Basic set|30.420.000|16.731.000|n.a|DE|
AX|10456000|AXOR Starck|AXOR Starck Single lever bath mixer floor-standing with pin handle|Bath mixer floorstanding|97.000.000|53.350.000|Chrome|DE|
AX|10456XXX|AXOR Starck|AXOR Starck Single lever bath mixer floor-standing with pin handle|Bath mixer floorstanding|145.500.000|80.025.000|Special Finishes|DE|Stock keeping finish 340
AX|10480000|AXOR Starck|AXOR Starck 2-hole rim mounted thermostatic bath mixer with zero handles|Bath mixer rim-mounted|15.946.000|8.770.000|Chrome|DE|Phase out 2026
AX|10480XXX|AXOR Starck|AXOR Starck 2-hole rim mounted thermostatic bath mixer with zero handles|Bath mixer rim-mounted|23.924.000|13.158.000|Special Finishes|DE|Phase out 2026
AX|10531000|AXOR Starck|AXOR Starck Baton hand shower 1jet EcoSmart|Hand shower|6.914.000|3.803.000|Chrome|DE|
AX|10531XXX|AXOR Starck|AXOR Starck Baton hand shower 1jet EcoSmart|Hand shower|10.370.000|5.704.000|Special Finishes|DE|Stock keeping finish 140, 340, 820 & 990
AX|10611000|AXOR Starck|AXOR Starck Single lever shower mixer for exposed installation with pin handle|Shower mixer wall mounted|32.857.000|18.071.000|Chrome|DE|
AX|10611XXX|AXOR Starck|AXOR Starck Single lever shower mixer for exposed installation with pin handle|Shower mixer wall mounted|49.290.000|27.110.000|Special Finishes|DE|Stock keeping finish 340
AX|10616000|AXOR Starck|AXOR Starck Single lever shower mixer for concealed installation with pin handle|Shower mixer concealed|16.732.000|9.203.000|Chrome|DE|
AX|10616XXX|AXOR Starck|AXOR Starck Single lever shower mixer for concealed installation with pin handle|Shower mixer concealed|25.102.000|13.806.000|Special Finishes|DE|Stock keeping finish 340
AX|10621800|AXOR ShowerSolutions|AXOR ShowerSolutions ShowerHeaven 970/970 3jet without lighting|Overhead shower|512.995.000|282.147.000|Stainless Steel Optic|FR|
AX|10623800|AXOR ShowerSolutions|AXOR ShowerSolutions ShowerHeaven 970/970 3jet with lighting|Overhead shower|559.598.000|307.779.000|Stainless Steel Optic|FR|
AX|10625800|AXOR ShowerSolutions|AXOR ShowerSolutions ShowerHeaven 720/720 3jet without lighting|Overhead shower|419.716.000|230.844.000|Stainless Steel Optic|FR|
AX|10627800|AXOR ShowerSolutions|AXOR ShowerSolutions ShowerHeaven 720/720 3jet with lighting|Overhead shower|466.343.000|256.489.000|Stainless Steel Optic|FR|
AX|10637000|AXOR ShowerSolutions|AXOR ShowerSolutions ShowerHeaven 1200/300 4jet without lighting|Overhead shower|432.756.000|238.016.000|Chrome|FR|
AX|10637XXX|AXOR ShowerSolutions|AXOR ShowerSolutions ShowerHeaven 1200/300 4jet without lighting|Overhead shower|778.959.000|428.427.000|Special Finishes|FR|
AX|10650180|AXOR ShowerSolutions|AXOR ShowerSolutions Basic set for hand shower module 120/120 for concealed installation|Basic set|12.066.000|6.636.000|n.a|DE|
AX|10651000|AXOR ShowerSolutions|AXOR ShowerSolutions Hand shower module 120/120 for concealed installation square|Hand shower|49.422.000|27.182.000|Chrome|DE|
AX|10651XXX|AXOR ShowerSolutions|AXOR ShowerSolutions Hand shower module 120/120 for concealed installation square|Hand shower|74.134.000|40.774.000|Special Finishes|DE|
AX|10658000|AXOR Starck|AXOR Starck Extension set for hand shower module|Spare part|9.796.000|5.388.000|n.a|DE|
AX|10700000|AXOR Starck|AXOR Starck Thermostat for concealed installation with shut-off valve|Thermostat concealed|44.652.000|24.559.000|Chrome|DE|
AX|10700XXX|AXOR Starck|AXOR Starck Thermostat for concealed installation with shut-off valve|Thermostat concealed|66.979.000|36.838.000|Special Finishes|DE|Stock keeping finish 340
AX|10720000|AXOR Starck|AXOR Starck Thermostat for concealed installation with shut-off/ diverter valve|Thermostat concealed|51.255.000|28.190.000|Chrome|DE|
AX|10720XXX|AXOR Starck|AXOR Starck Thermostat for concealed installation with shut-off/ diverter valve|Thermostat concealed|76.879.000|42.283.000|Special Finishes|DE|Stock keeping finish 340
AX|10750180|AXOR ShowerSolutions|AXOR ShowerSolutions Basic set for thermostatic module 360/120 for concealed installation|Thermostat concealed|56.032.000|30.818.000|n.a|DE|
AX|10751000|AXOR ShowerSolutions|AXOR ShowerSolutions Thermostatic module 360/120 for concealed installation square for 3 functions|Thermostat concealed|69.954.000|38.475.000|Chrome|DE|
AX|10751XXX|AXOR ShowerSolutions|AXOR ShowerSolutions Thermostatic module 360/120 for concealed installation square for 3 functions|Thermostat concealed|104.934.000|57.714.000|Special Finishes|DE|
AX|10754180|AXOR ShowerSolutions|AXOR ShowerSolutions Basic set for thermostatic module 120/120 for concealed installation|Thermostat concealed|21.558.000|11.857.000|n.a|DE|
AX|10755000|AXOR ShowerSolutions|AXOR ShowerSolutions Thermostatic module 120/120 for concealed installation square|Thermostat concealed|45.253.000|24.889.000|Chrome|DE|
AX|10755XXX|AXOR ShowerSolutions|AXOR ShowerSolutions Thermostatic module 120/120 for concealed installation square|Thermostat concealed|67.872.000|37.330.000|Special Finishes|DE|
AX|10790000|AXOR ShowerSolutions|AXOR ShowerSolutions Extension set 25 mm for thermostatic module|Spare part|6.570.000|3.614.000|Chrome|DE|
AX|10790XXX|AXOR ShowerSolutions|AXOR ShowerSolutions Extension set 25 mm for thermostatic module|Spare part|9.854.000|5.420.000|Special Finishes|DE|
AX|10820000|AXOR Starck|AXOR Starck Single lever kitchen mixer 240 Semi-Pro|1-hole kitchen faucet|46.581.000|25.620.000|Chrome|DE|Phase out 2026
AX|10820800|AXOR Starck|AXOR Starck Single lever kitchen mixer 240 Semi-Pro|1-hole kitchen faucet|69.868.000|38.427.000|Stainless Steel Optic|DE|Phase out 2026
AX|10820XXX|AXOR Starck|AXOR Starck Single lever kitchen mixer 240 Semi-Pro|1-hole kitchen faucet|69.874.000|38.431.000|Special Finishes|DE|Phase out 2026
AX|10821000|AXOR Starck|AXOR Starck Single lever kitchen mixer 270 with pull-out spray|1-hole kitchen faucet|36.059.000|19.832.000|Chrome|DE|
AX|10821800|AXOR Starck|AXOR Starck Single lever kitchen mixer 270 with pull-out spray|1-hole kitchen faucet|48.813.000|26.847.000|Stainless Steel Optic|DE|
AX|10821XXX|AXOR Starck|AXOR Starck Single lever kitchen mixer 270 with pull-out spray|1-hole kitchen faucet|54.096.000|29.753.000|Special Finishes|DE|Stock keeping finish 340
AX|10822000|AXOR Starck|AXOR Starck Single lever kitchen mixer 300 with swivel spout|1-hole kitchen faucet|30.981.000|17.040.000|Chrome|DE|
AX|10822800|AXOR Starck|AXOR Starck Single lever kitchen mixer 300 with swivel spout|1-hole kitchen faucet|41.932.000|23.063.000|Stainless Steel Optic|DE|
AX|10822XXX|AXOR Starck|AXOR Starck Single lever kitchen mixer 300 with swivel spout|1-hole kitchen faucet|46.468.000|25.557.000|Special Finishes|DE|
AX|10902180|AXOR Starck|AXOR Starck Basic set|Basic set|21.732.000|11.953.000|n.a|DE|
AX|10921180|AXOR ShowerSolutions|AXOR ShowerSolutions Basic set for overhead shower 240/240 1jet with shower arm|Basic set|14.618.000|8.040.000|n.a|DE|
AX|10922180|AXOR ShowerSolutions|AXOR ShowerSolutions Basic set for ShowerHeaven 1200/300 4jet|Basic set|34.728.000|19.100.000|n.a|FR|
AX|10924000|AXOR ShowerSolutions|AXOR ShowerSolutions Overhead shower 240/240 1jet ceiling integrated|Overhead shower|64.995.000|35.747.000|Chrome|FR|
AX|10924XXX|AXOR ShowerSolutions|AXOR ShowerSolutions Overhead shower 240/240 1jet ceiling integrated|Overhead shower|97.495.000|53.622.000|Special Finishes|FR|
AX|10925000|AXOR ShowerSolutions|AXOR ShowerSolutions Overhead shower 240/240 1jet with shower arm|Overhead shower|89.365.000|49.151.000|Chrome|FR|
AX|10925XXX|AXOR ShowerSolutions|AXOR ShowerSolutions Overhead shower 240/240 1jet with shower arm|Overhead shower|134.049.000|73.727.000|Special Finishes|FR|Stock keeping finish 340
AX|10929000|AXOR ShowerSolutions|AXOR ShowerSolutions Overhead shower 240/240 1jet with ceiling connection|Overhead shower|77.181.000|42.450.000|Chrome|FR|
AX|10929XXX|AXOR ShowerSolutions|AXOR ShowerSolutions Overhead shower 240/240 1jet with ceiling connection|Overhead shower|115.767.000|63.672.000|Special Finishes|FR|
AX|10932000|AXOR ShowerSolutions|AXOR ShowerSolutions Shut-off/ diverter valve Trio/ Quattro 120/120 for concealed installation|Valve concealed|17.718.000|9.745.000|Chrome|DE|
AX|10932XXX|AXOR ShowerSolutions|AXOR ShowerSolutions Shut-off/ diverter valve Trio/ Quattro 120/120 for concealed installation|Valve concealed|26.581.000|14.620.000|Special Finishes|DE|
AX|10941180|AXOR ShowerSolutions|AXOR ShowerSolutions Basic set for flood spout 240/120 for concealed installation|Basic set|14.618.000|8.040.000|n.a|DE|
AX|10942000|AXOR ShowerSolutions|AXOR ShowerSolutions Flood spout 240/120 for concealed installation|Bath filler|44.534.000|24.494.000|Chrome|DE|
AX|10942XXX|AXOR ShowerSolutions|AXOR ShowerSolutions Flood spout 240/120 for concealed installation|Bath filler|66.800.000|36.740.000|Special Finishes|DE|
AX|10971180|AXOR ShowerSolutions|AXOR ShowerSolutions Basic set for shut-off valve 120/120 for concealed installation|Basic set|8.966.000|4.931.000|n.a|DE|
AX|10972000|AXOR ShowerSolutions|AXOR ShowerSolutions Shut-off valve 120/120 for concealed installation square|Valve concealed|14.477.000|7.962.000|Chrome|DE|
AX|10972XXX|AXOR ShowerSolutions|AXOR ShowerSolutions Shut-off valve 120/120 for concealed installation square|Valve concealed|21.712.000|11.942.000|Special Finishes|DE|
AX|10980000|AXOR Starck|AXOR Starck Extension set 28 mm for shower columns|Spare part|15.024.000|8.263.000|n.a|DE|
AX|10981000|AXOR Starck|AXOR Starck Extension 60 mm for spout|Spare part|19.319.000|10.625.000|Chrome|DE|
AX|10981XXX|AXOR Starck|AXOR Starck Extension 60 mm for spout|Spare part|28.978.000|15.938.000|Special Finishes|DE|
AX|11020000|AXOR Urquiola|AXOR Urquiola Single lever basin mixer 130 with pop-up waste set|1-hole basin mixer|39.649.000|21.807.000|Chrome|DE|
AX|11020XXX|AXOR Urquiola|AXOR Urquiola Single lever basin mixer 130 with pop-up waste set|1-hole basin mixer|59.479.000|32.713.000|Special Finishes|DE|
AX|11021000|AXOR Urquiola|AXOR Urquiola Single lever basin mixer 130 with waste set|1-hole basin mixer|39.649.000|21.807.000|Chrome|DE|
AX|11021XXX|AXOR Urquiola|AXOR Urquiola Single lever basin mixer 130 with waste set|1-hole basin mixer|59.479.000|32.713.000|Special Finishes|DE|
AX|11024000|AXOR Urquiola|AXOR Urquiola 2-handle basin mixer 120 with pop-up waste set|2-handle basin mixer|44.787.000|24.633.000|Chrome|DE|
AX|11024XXX|AXOR Urquiola|AXOR Urquiola 2-handle basin mixer 120 with pop-up waste set|2-handle basin mixer|67.179.000|36.948.000|Special Finishes|DE|
AX|11025000|AXOR Urquiola|AXOR Urquiola Single lever basin mixer 110 for hand wash basins with pop-up waste set|1-hole basin mixer|39.649.000|21.807.000|Chrome|DE|
AX|11025XXX|AXOR Urquiola|AXOR Urquiola Single lever basin mixer 110 for hand wash basins with pop-up waste set|1-hole basin mixer|59.479.000|32.713.000|Special Finishes|DE|
AX|11026000|AXOR Urquiola|AXOR Urquiola Single lever basin mixer for concealed installation wall-mounted with spout 200 mm|2-hole basin mixer concealed|47.569.000|26.163.000|Chrome|DE|
AX|11026XXX|AXOR Urquiola|AXOR Urquiola Single lever basin mixer for concealed installation wall-mounted with spout 200 mm|2-hole basin mixer concealed|71.353.000|39.244.000|Special Finishes|DE|
AX|11035000|AXOR Urquiola|AXOR Urquiola Single lever basin mixer 280 for wash bowls with waste set|1-hole basin mixer|49.072.000|26.990.000|Chrome|DE|Phase out 2027
AX|11035XXX|AXOR Urquiola|AXOR Urquiola Single lever basin mixer 280 for wash bowls with waste set|1-hole basin mixer|73.606.000|40.483.000|Special Finishes|DE|Phase out 2027
AX|11040000|AXOR Urquiola|AXOR Urquiola 3-hole basin mixer 50 with plate and pop-up waste set|3-hole basin mixer|52.250.000|28.738.000|Chrome|DE|
AX|11040XXX|AXOR Urquiola|AXOR Urquiola 3-hole basin mixer 50 with plate and pop-up waste set|3-hole basin mixer|78.374.000|43.106.000|Special Finishes|DE|
AX|11041000|AXOR Urquiola|AXOR Urquiola 3-hole basin mixer 50 with escutcheons and pop-up waste set|3-hole basin mixer|47.569.000|26.163.000|Chrome|DE|
AX|11041XXX|AXOR Urquiola|AXOR Urquiola 3-hole basin mixer 50 with escutcheons and pop-up waste set|3-hole basin mixer|71.353.000|39.244.000|Special Finishes|DE|
AX|11042000|AXOR Urquiola|AXOR Urquiola 3-hole basin mixer for concealed installation wall-mounted with spout 168 mm|3-hole basin mixer wall|48.991.000|26.945.000|Chrome|DE|Phase out 2026
AX|11042XXX|AXOR Urquiola|AXOR Urquiola 3-hole basin mixer for concealed installation wall-mounted with spout 168 mm|3-hole basin mixer wall|73.485.000|40.417.000|Special Finishes|DE|Phase out 2026
AX|11043000|AXOR Urquiola|AXOR Urquiola 3-hole basin mixer for concealed installation wall-mounted with spout 228 mm|3-hole basin mixer wall|52.705.000|28.988.000|Chrome|DE|Phase out 2026
AX|11043XXX|AXOR Urquiola|AXOR Urquiola 3-hole basin mixer for concealed installation wall-mounted with spout 228 mm|3-hole basin mixer wall|79.062.000|43.484.000|Special Finishes|DE|Phase out 2026
AX|11220000|AXOR Urquiola|AXOR Urquiola Single lever bidet mixer with pop-up waste set|Bidet faucet|39.649.000|21.807.000|Chrome|DE|
AX|11220XXX|AXOR Urquiola|AXOR Urquiola Single lever bidet mixer with pop-up waste set|Bidet faucet|59.479.000|32.713.000|Special Finishes|DE|
AX|11300000|AXOR Urquiola|AXOR Urquiola Wash bowl 624/408|Washbasin|108.749.000|59.812.000|Alpin-white|DE|Phase out 2026
AX|11301000|AXOR Urquiola|AXOR Urquiola Wash bowl 511/427|Washbasin|97.301.000|53.516.000|Alpin-white|DE|Phase out 2026
AX|11302000|AXOR Urquiola|AXOR Urquiola Wash basin 624/399 wall-mounted|Washbasin|120.192.000|66.106.000|Alpin-white|DE|Phase out 2026
AX|11420000|AXOR Urquiola|AXOR Urquiola Single lever bath mixer for exposed installation|Bath mixer wall mounted|69.954.000|38.475.000|Chrome|DE|Phase out 2026
AX|11420XXX|AXOR Urquiola|AXOR Urquiola Single lever bath mixer for exposed installation|Bath mixer wall mounted|104.934.000|57.714.000|Special Finishes|DE|
AX|11422000|AXOR Urquiola|AXOR Urquiola Bath thermostat floor-standing|Bath mixer floorstanding|158.568.000|87.212.000|Chrome|DE|
AX|11422XXX|AXOR Urquiola|AXOR Urquiola Bath thermostat floor-standing|Bath mixer floorstanding|237.850.000|130.818.000|Special Finishes|DE|
AX|11425000|AXOR Urquiola|AXOR Urquiola Single lever bath mixer for concealed installation|Bath mixer concealed|30.802.000|16.941.000|Chrome|DE|
AX|11425XXX|AXOR Urquiola|AXOR Urquiola Single lever bath mixer for concealed installation|Bath mixer concealed|46.207.000|25.414.000|Special Finishes|DE|
AX|11430000|AXOR Urquiola|AXOR Urquiola Bath spout|Bath filler|26.104.000|14.357.000|Chrome|DE|Phase out 2026
AX|11430XXX|AXOR Urquiola|AXOR Urquiola Bath spout|Bath filler|39.158.000|21.537.000|Special Finishes|DE|Phase out 2026
AX|11436000|AXOR Urquiola|AXOR Urquiola 3-hole rim mounted bath mixer|Bath mixer rim-mounted|69.954.000|38.475.000|Chrome|DE|Phase out 2026
AX|11436XXX|AXOR Urquiola|AXOR Urquiola 3-hole rim mounted bath mixer|Bath mixer rim-mounted|104.934.000|57.714.000|Special Finishes|DE|Phase out 2026
AX|11440000|AXOR Urquiola|AXOR Urquiola Bath tub 1800/600|Bathtub|629.583.000|346.271.000|Alpin-white|DE|Phase out 2026
AX|11443000|AXOR Urquiola|AXOR Urquiola 4-hole rim mounted bath mixer|Bath mixer rim-mounted|93.292.000|51.311.000|Chrome|DE|Phase out 2026
AX|11443XXX|AXOR Urquiola|AXOR Urquiola 4-hole rim mounted bath mixer|Bath mixer rim-mounted|139.936.000|76.965.000|Special Finishes|DE|Phase out 2026
AX|11445000|AXOR Urquiola|AXOR Urquiola 4-hole tile mounted bath mixer|Bath mixer tile-mounted|111.912.000|61.552.000|Chrome|DE|Phase out 2026
AX|11445XXX|AXOR Urquiola|AXOR Urquiola 4-hole tile mounted bath mixer|Bath mixer tile-mounted|167.871.000|92.329.000|Special Finishes|DE|Phase out 2026
"""

def parse_axor_hansgrohe():
    products = []
    # parse embedded tabular text
    for line in AXOR_HANSGROHE_RAW.strip().split('\n'):
        if not line or not line.startswith('AX|') and not line.startswith('HG|'):
            continue
        parts = line.split('|')
        if len(parts) >= 8:
            brand_code = parts[0]
            sku = parts[1].strip()
            series = parts[2].strip()
            name = parts[3].strip()
            category = parts[4].strip()
            list_p = clean_money(parts[5])
            dp_p = clean_money(parts[6])
            color = parts[7].strip() if len(parts) > 7 and parts[7].strip() else "Chrome"
            origin = parts[8].strip() if len(parts) > 8 else "DE"
            notes = parts[9].strip() if len(parts) > 9 else ""
            
            brand_name = "AXOR" if brand_code == "AX" else "Hansgrohe"
            desc = f"{series} - {notes}" if notes else series
            
            products.append({
                "sku": sku,
                "name": name,
                "category": category or "Thiết bị sen vòi & bồn tắm",
                "brand": brand_name,
                "color": color,
                "size": "Standard",
                "unit": "Bộ" if "set" in name.lower() or "mixer" in name.lower() or "showerpipe" in name.lower() else "Cái",
                "listPrice": list_p,
                "dpPrice": dp_p,
                "description": desc,
                "status": "active"
            })
    return products

if __name__ == '__main__':
    prods = parse_axor_hansgrohe()
    print(f"Parsed {len(prods)} products from AXOR/Hansgrohe base")
