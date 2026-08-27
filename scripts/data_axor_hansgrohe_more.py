# -*- coding: utf-8 -*-
# Additional extensive products for AXOR and Hansgrohe from PDF 1
import re

def clean_money(s):
    if not s:
        return 0
    t = re.sub(r'[^\d]', '', str(s))
    return int(t) if t else 0

AXOR_HG_MORE_RAW = """
AX|12010000|AXOR Starck Organic|AXOR Starck Organic 2-handle basin mixer 80 with pop-up waste set|2-handle basin mixer|30.753.000|16.914.000|Chrome|DE|
AX|12010XXX|AXOR Starck Organic|AXOR Starck Organic 2-handle basin mixer 80 with pop-up waste set|2-handle basin mixer|46.130.000|25.372.000|Special Finishes|DE|
AX|12011000|AXOR Starck Organic|AXOR Starck Organic 2-handle basin mixer 80 with waste set|2-handle basin mixer|30.753.000|16.914.000|Chrome|DE|
AX|12012000|AXOR Starck Organic|AXOR Starck Organic 2-handle basin mixer 170 for wash bowls with waste set|2-handle basin mixer|38.834.000|21.359.000|Chrome|DE|
AX|12013000|AXOR Starck Organic|AXOR Starck Organic 2-handle basin mixer 240 for wash bowls with waste set|2-handle basin mixer|46.926.000|25.809.000|Chrome|DE|
AX|12016000|AXOR Starck Organic|AXOR Starck Organic Bath thermostat floor-standing|Bath mixer floorstanding|133.765.000|73.571.000|Chrome|DE|
AX|12112000|AXOR Starck V|AXOR Starck V Single lever basin mixer 140 with glass spout and waste set|1-hole basin mixer|71.398.000|39.269.000|Chrome|DE|
AX|12112450|AXOR Starck V|AXOR Starck V Single lever basin mixer 140 with glass spout and waste set|1-hole basin mixer|86.862.000|47.774.000|White|DE|
AX|12114000|AXOR Starck V|AXOR Starck V Single lever basin mixer 220 with glass spout for wash bowls with waste set|1-hole basin mixer|90.518.000|49.785.000|Chrome|DE|
AX|12115000|AXOR Starck V|AXOR Starck V 2-hole basin mixer 110 with waste set|2-hole basin mixer|80.966.000|44.531.000|Chrome|DE|
AX|12171000|AXOR Starck Organic|AXOR Starck Organic Electronic basin mixer with temperature control battery-operated|E-Faucets|52.032.000|28.618.000|Chrome|DE|
AX|12571000|AXOR ShowerComposition|AXOR ShowerComposition Thermostatic module 470/110 for concealed installation for 2 functions|Thermostat concealed|96.016.000|52.809.000|Chrome|DE|
AX|12571670|AXOR ShowerComposition|AXOR ShowerComposition Thermostatic module 470/110 for concealed installation for 2 functions|Thermostat concealed|134.426.000|73.934.000|Matt Black|DE|
AX|12572000|AXOR ShowerComposition|AXOR ShowerComposition Thermostatic module 540/110 for concealed installation for 3 functions|Thermostat concealed|106.691.000|58.680.000|Chrome|DE|
AX|12573000|AXOR ShowerComposition|AXOR ShowerComposition Thermostatic module 610/110 for concealed installation for 4 functions|Thermostat concealed|117.360.000|64.548.000|Chrome|DE|
AX|12595000|AXOR ShowerComposition|AXOR ShowerComposition Shower panel with thermostat, overhead shower 110/220 1jet and shoulder shower|Shower columns|224.042.000|123.223.000|Chrome|DE|
AX|12595670|AXOR ShowerComposition|AXOR ShowerComposition Shower panel with thermostat, overhead shower 110/220 1jet and shoulder shower|Shower columns|313.657.000|172.511.000|Matt Black|DE|
AX|12670670|AXOR Starck|AXOR Starck Nature shower column with overhead shower 240 1jet|Showerpipe|210.754.000|115.915.000|Matt Black|DE|
AX|12670800|AXOR Starck|AXOR Starck Nature shower column with overhead shower 240 1jet|Showerpipe|225.806.000|124.193.000|Stainless Steel Optic|DE|
AX|12672000|AXOR Starck|AXOR Starck Shower column with thermostat and overhead shower 240 1jet|Showerpipe|150.532.000|82.793.000|Chrome|DE|
AX|16515000|AXOR Montreux|AXOR Montreux Single lever basin mixer 100 with lever handle and pop-up waste set|1-hole basin mixer|28.591.000|15.725.000|Chrome|DE|
AX|16517000|AXOR Montreux|AXOR Montreux Single lever basin mixer 210 with lever handle and pop-up waste set|1-hole basin mixer|32.160.000|17.688.000|Chrome|DE|
AX|16540000|AXOR Montreux|AXOR Montreux 2-handle bath mixer for exposed installation with cross handles|Bath mixer wall mounted|71.635.000|39.399.000|Chrome|DE|
AX|16547000|AXOR Montreux|AXOR Montreux 2-handle bath mixer floor-standing with cross handles|Bath mixer floorstanding|161.991.000|89.095.000|Chrome|DE|
AX|16572000|AXOR Montreux|AXOR Montreux Showerpipe with thermostat and overhead shower 240 1jet|Showerpipe|139.355.000|76.645.000|Chrome|DE|
AX|16580000|AXOR Montreux|AXOR Montreux Single lever kitchen mixer 260 with swivel spout|1-hole kitchen faucet|28.591.000|15.725.000|Chrome|DE|
AX|16581000|AXOR Montreux|AXOR Montreux Single lever kitchen mixer 180 with pull-out spray|1-hole kitchen faucet|35.731.000|19.652.000|Chrome|DE|
AX|18010000|AXOR Massaud|AXOR Massaud Single lever basin mixer 110 with waste set|1-hole basin mixer|54.817.000|30.149.000|Chrome|DE|
AX|18020000|AXOR Massaud|AXOR Massaud Single lever basin mixer 220 for wash bowls with waste set|1-hole basin mixer|82.474.000|45.361.000|Chrome|DE|
AX|18450000|AXOR Massaud|AXOR Massaud Single lever bath mixer floor-standing|Bath mixer floorstanding|213.167.000|117.242.000|Chrome|DE|
AX|26020000|AXOR Showers/Front|AXOR Showers/Front Showerpipe with thermostat and overhead shower 240 2jet|Showerpipe|122.758.000|67.517.000|Chrome|DE|
AX|26034000|AXOR ShowerSolutions|AXOR ShowerSolutions Overhead shower 350 1jet with shower arm|Overhead shower|152.334.000|83.784.000|Chrome|FR|
AX|26050000|AXOR ShowerSolutions|AXOR ShowerSolutions Hand shower 120 3jet|Hand shower|6.653.000|3.659.000|Chrome|FR|
AX|26050670|AXOR ShowerSolutions|AXOR ShowerSolutions Hand shower 120 3jet|Hand shower|9.310.000|5.121.000|Matt Black|FR|
AX|28790000|AXOR Citterio C|AXOR Citterio C Overhead shower 270/270 1jet with shower arm|Overhead shower|29.877.000|16.432.000|Chrome|FR|
AX|28790670|AXOR Citterio C|AXOR Citterio C Overhead shower 270/270 1jet with shower arm|Overhead shower|41.828.000|23.005.000|Matt Black|FR|
AX|28790140|AXOR Citterio C|AXOR Citterio C Overhead shower 270/270 1jet with shower arm|Overhead shower|44.817.000|24.649.000|Brushed Bronze|FR|
AX|28790340|AXOR Citterio C|AXOR Citterio C Overhead shower 270/270 1jet with shower arm|Overhead shower|44.817.000|24.649.000|Brushed Black Chrome|FR|
AX|29240000|AXOR Bidette Showers|AXOR Bidette Showers Bidette hand shower 1jet round for cold water with shower holder and hose 1.25 m|Hygiene Shower / Bidette|14.645.000|8.055.000|Chrome|DE|
AX|29240670|AXOR Bidette Showers|AXOR Bidette Showers Bidette hand shower 1jet round for cold water with shower holder and hose 1.25 m|Hygiene Shower / Bidette|21.966.000|12.081.000|Matt Black|DE|
AX|29241000|AXOR Bidette Showers|AXOR Bidette Showers Bidette hand shower 1jet softsquare for cold water with shower holder and hose 1.25 m|Hygiene Shower / Bidette|14.645.000|8.055.000|Chrome|DE|
AX|29242000|AXOR Bidette Showers|AXOR Bidette Showers Bidette hand shower 1jet round for mixed water with shower holder and shower hose 1.25 m|Hygiene Shower / Bidette|23.538.000|12.946.000|Chrome|DE|
AX|34010000|AXOR Citterio M|AXOR Citterio M Single lever basin mixer 100 with pop-up waste set|1-hole basin mixer|23.562.000|12.959.000|Chrome|DE|
AX|34017000|AXOR Citterio M|AXOR Citterio M Single lever basin mixer 100 with waste set|1-hole basin mixer|23.562.000|12.959.000|Chrome|DE|
AX|34420000|AXOR Citterio M|AXOR Citterio M Single lever bath mixer for exposed installation|Bath mixer wall mounted|40.045.000|22.025.000|Chrome|DE|
AX|34820000|AXOR Citterio M|AXOR Citterio M 2-hole single lever kitchen mixer 240 with swivel spout|2-hole kitchen faucet|28.131.000|15.472.000|Chrome|DE|
AX|34822000|AXOR Citterio M|AXOR Citterio M 2-hole single lever kitchen mixer 220 with pull-out spray|2-hole kitchen faucet|32.684.000|17.976.000|Chrome|DE|
AX|35300000|AXOR ShowerSolutions|AXOR ShowerSolutions Overhead shower 300 1jet with shower arm|Overhead shower|87.477.000|48.112.000|Chrome|DE|
AX|35300670|AXOR ShowerSolutions|AXOR ShowerSolutions Overhead shower 300 1jet with shower arm|Overhead shower|122.469.000|67.358.000|Matt Black|DE|
AX|35380000|AXOR Conscious Showers|AXOR ShowerSolutions Overhead shower 245 1jet|Overhead shower|32.470.000|17.859.000|Chrome|DE|
AX|35380670|AXOR Conscious Showers|AXOR ShowerSolutions Overhead shower 245 1jet|Overhead shower|45.462.000|25.004.000|Matt Black|DE|
AX|36100000|AXOR Citterio E|AXOR Citterio E Single lever basin mixer 130 with pin handle and pop-up waste set|1-hole basin mixer|26.387.000|14.513.000|Chrome|DE|
AX|36100670|AXOR Citterio E|AXOR Citterio E Single lever basin mixer 130 with pin handle and pop-up waste set|1-hole basin mixer|36.923.000|20.308.000|Matt Black|DE|
AX|36104000|AXOR Citterio E|AXOR Citterio E Single lever basin mixer 250 with pin handle for wash bowls with waste set|1-hole basin mixer|38.259.000|21.042.000|Chrome|DE|
AX|36104670|AXOR Citterio E|AXOR Citterio E Single lever basin mixer 250 with pin handle for wash bowls with waste set|1-hole basin mixer|53.560.000|29.458.000|Matt Black|DE|
AX|36110000|AXOR Citterio E|AXOR Citterio E Single lever basin mixer 130 with lever handle and pop-up waste set|1-hole basin mixer|23.747.000|13.061.000|Chrome|DE|
AX|36110670|AXOR Citterio E|AXOR Citterio E Single lever basin mixer 130 with lever handle and pop-up waste set|1-hole basin mixer|33.234.000|18.279.000|Matt Black|DE|
AX|36140000|AXOR Citterio E|AXOR Citterio E Bath thermostat for exposed installation|Thermostat exposed|30.677.000|16.872.000|Chrome|DE|
AX|36416000|AXOR Citterio E|AXOR Citterio E Bath thermostat floor-standing|Bath mixer floorstanding|118.918.000|65.405.000|Chrome|DE|
AX|36416670|AXOR Citterio E|AXOR Citterio E Bath thermostat floor-standing|Bath mixer floorstanding|166.471.000|91.559.000|Matt Black|DE|
AX|36750000|AXOR ShowerSelect ID|AXOR ShowerSelect ID Thermostat for concealed installation round for 2 functions|Thermostat concealed|45.079.000|24.793.000|Chrome|DE|
AX|36750670|AXOR ShowerSelect ID|AXOR ShowerSelect ID Thermostat for concealed installation round for 2 functions|Thermostat concealed|63.107.000|34.709.000|Matt Black|DE|
AX|36750140|AXOR ShowerSelect ID|AXOR ShowerSelect ID Thermostat for concealed installation round for 2 functions|Thermostat concealed|67.618.000|37.190.000|Brushed Bronze|DE|
AX|36750340|AXOR ShowerSelect ID|AXOR ShowerSelect ID Thermostat for concealed installation round for 2 functions|Thermostat concealed|67.618.000|37.190.000|Brushed Black Chrome|DE|
AX|36752000|AXOR ShowerSelect ID|AXOR ShowerSelect ID Thermostat for concealed installation square for 2 functions|Thermostat concealed|45.079.000|24.793.000|Chrome|DE|
AX|36752670|AXOR ShowerSelect ID|AXOR ShowerSelect ID Thermostat for concealed installation square for 2 functions|Thermostat concealed|63.107.000|34.709.000|Matt Black|DE|
AX|38010000|AXOR Uno|AXOR Uno Electronic basin mixer with temperature pre-adjustment with mains connection 230 V|E-Faucets|58.866.000|32.376.000|Chrome|DE|
AX|38010670|AXOR Uno|AXOR Uno Electronic basin mixer with temperature pre-adjustment with mains connection 230 V|E-Faucets|82.393.000|45.316.000|Matt Black|DE|
AX|38412000|AXOR Uno|AXOR Uno Bath spout curved floor-standing|Bath filler|67.852.000|37.319.000|Chrome|DE|
AX|38412670|AXOR Uno|AXOR Uno Bath spout curved floor-standing|Bath filler|94.996.000|52.248.000|Matt Black|DE|
AX|39010000|AXOR Citterio|AXOR Citterio Single lever basin mixer 110 with pin handle and pop-up waste set|1-hole basin mixer|38.938.000|21.416.000|Chrome|DE|
AX|39020000|AXOR Citterio|AXOR Citterio Single lever basin mixer 280 with pin handle for wash bowls with pop-up waste set|1-hole basin mixer|58.966.000|32.431.000|Chrome|DE|
AX|39021000|AXOR Citterio|AXOR Citterio Single lever basin mixer 280 with lever handle for wash bowls with waste set|1-hole basin mixer|46.685.000|25.677.000|Chrome|DE|
AX|39440000|AXOR Citterio|AXOR Citterio Single lever bath mixer floor-standing with lever handle|Bath mixer floorstanding|109.134.000|60.024.000|Chrome|DE|
AX|39451000|AXOR Citterio|AXOR Citterio Single lever bath mixer floor-standing with pin handle|Bath mixer floorstanding|136.526.000|75.089.000|Chrome|DE|
AX|39745000|AXOR ShowerSphere|AXOR ShowerSphere Overhead shower 370/220 2jet with adjustable shower arm|Overhead shower|75.833.000|41.708.000|Chrome|DE|
AX|39745140|AXOR ShowerSphere|AXOR ShowerSphere Overhead shower 370/220 2jet with adjustable shower arm|Overhead shower|113.748.000|62.561.000|Brushed Bronze|DE|
AX|39745340|AXOR ShowerSphere|AXOR ShowerSphere Overhead shower 370/220 2jet with adjustable shower arm|Overhead shower|113.748.000|62.561.000|Brushed Black Chrome|DE|
AX|39745670|AXOR ShowerSphere|AXOR ShowerSphere Overhead shower 370/220 2jet with adjustable shower arm|Overhead shower|105.000.000|58.000.000|Matt Black|DE|
AX|42000000|AXOR Suite Basins & Bathtub|AXOR Suite Basins & Bathtub Wash bowl 300 without tap hole and overflow|Washbasin|89.365.000|49.151.000|Chrome|DE|
AX|42000670|AXOR Suite Basins & Bathtub|AXOR Suite Basins & Bathtub Wash bowl 300 without tap hole and overflow|Washbasin|89.365.000|49.151.000|Matt Black|DE|
AX|42005000|AXOR Suite Basins & Bathtub|AXOR Suite Basins & Bathtub Bathtub 1900/850|Bathtub|539.132.000|296.523.000|Chrome|DE|
AX|42005670|AXOR Suite Basins & Bathtub|AXOR Suite Basins & Bathtub Bathtub 1900/850|Bathtub|539.132.000|296.523.000|Matt Black|DE|
AX|42520000|AXOR Drain|AXOR Drain Finish set shower drain 700|Shower drain|35.875.000|19.731.000|Chrome|DE|
AX|42520670|AXOR Drain|AXOR Drain Finish set shower drain 700|Shower drain|35.875.000|19.731.000|Matt Black|DE|
AX|42520140|AXOR Drain|AXOR Drain Finish set shower drain 700|Shower drain|35.875.000|19.731.000|Brushed Bronze|DE|
AX|42520340|AXOR Drain|AXOR Drain Finish set shower drain 700|Shower drain|35.875.000|19.731.000|Brushed Black Chrome|DE|
AX|42530000|AXOR FlushPlate|Nút nhấn xả Flush plate AXOR|Flush plate|18.635.000|10.249.000|Chrome|DE|
AX|42530670|AXOR FlushPlate|Nút nhấn xả Flush plate AXOR|Flush plate|26.084.000|14.346.000|Matt Black|DE|
AX|46011000|AXOR Edge|AXOR Edge Single lever basin mixer 130 with push-open waste set - diamond cut|1-hole basin mixer|61.453.000|33.799.000|Chrome|DE|
AX|46031000|AXOR Edge|AXOR Edge Single lever basin mixer 280 for wash bowls with push-open waste set - diamond cut|1-hole basin mixer|79.912.000|43.952.000|Chrome|DE|
AX|46041000|AXOR Edge|AXOR Edge Single lever basin mixer floor-standing with push-open waste set - diamond cut|Bath mixer floorstanding|151.797.000|83.488.000|Chrome|DE|
AX|46701000|AXOR Edge|AXOR Edge Thermostatic module Select 470/100 for concealed installation for 2 functions - diamond cut|Thermostat concealed|122.892.000|67.591.000|Chrome|DE|
AX|47010000|AXOR MyEdition|AXOR MyEdition Single lever basin mixer 70 with push-open waste set|1-hole basin mixer|40.372.000|22.205.000|Chrome / Mirror Glass|DE|
AX|47010670|AXOR MyEdition|AXOR MyEdition Single lever basin mixer 70 with push-open waste set|1-hole basin mixer|56.525.000|31.089.000|Matt Black/Black Glass|DE|
AX|47020000|AXOR MyEdition|AXOR MyEdition Single lever basin mixer 230 for wash bowls with push-open waste set|1-hole basin mixer|52.497.000|28.873.000|Chrome / Mirror Glass|DE|
AX|47020670|AXOR MyEdition|AXOR MyEdition Single lever basin mixer 230 for wash bowls with push-open waste set|1-hole basin mixer|73.485.000|40.417.000|Matt Black/Black Glass|DE|
AX|47040000|AXOR MyEdition|AXOR MyEdition Single lever basin mixer floor-standing with push-open waste set|Basin mixer floorstanding|100.933.000|55.513.000|Chrome / Mirror Glass|DE|
AX|47040670|AXOR MyEdition|AXOR MyEdition Single lever basin mixer floor-standing with push-open waste set|Basin mixer floorstanding|141.310.000|77.721.000|Matt Black/Black Glass|DE|
AX|47440000|AXOR MyEdition|AXOR MyEdition Single lever bath mixer floor-standing|Bath mixer floorstanding|141.312.000|77.722.000|Chrome / Mirror Glass|DE|
AX|47440670|AXOR MyEdition|AXOR MyEdition Single lever bath mixer floor-standing|Bath mixer floorstanding|197.840.000|108.812.000|Matt Black/Black Glass|DE|
AX|48000000|AXOR One|AXOR One Single lever basin mixer 70 with lever handle and pop-up waste set|1-hole basin mixer|21.225.000|11.674.000|Chrome|DE|
AX|48000670|AXOR One|AXOR One Single lever basin mixer 70 with lever handle and pop-up waste set|1-hole basin mixer|29.710.000|16.341.000|Matt Black|DE|
AX|48002000|AXOR One|AXOR One Single lever basin mixer 260 with lever handle for wash bowls with waste set|1-hole basin mixer|27.281.000|15.005.000|Chrome|DE|
AX|48002670|AXOR One|AXOR One Single lever basin mixer 260 with lever handle for wash bowls with waste set|1-hole basin mixer|38.200.000|21.010.000|Matt Black|DE|
AX|48010000|AXOR One|AXOR One Basin mixer Select 140 with push-open waste set|1-hole basin mixer|26.072.000|14.340.000|Chrome|DE|
AX|48010670|AXOR One|AXOR One Basin mixer Select 140 with push-open waste set|1-hole basin mixer|36.500.000|20.075.000|Matt Black|DE|
AX|48440000|AXOR One|AXOR One Single lever bath mixer floor-standing|Bath mixer floorstanding|109.134.000|60.024.000|Chrome|DE|
AX|48440670|AXOR One|AXOR One Single lever bath mixer floor-standing|Bath mixer floorstanding|152.785.000|84.032.000|Matt Black|DE|
AX|48491000|AXOR One|AXOR One Overhead shower 280 1jet with shower arm|Overhead shower|57.606.000|31.683.000|Chrome|DE|
AX|48491670|AXOR One|AXOR One Overhead shower 280 1jet with shower arm|Overhead shower|80.636.000|44.350.000|Matt Black|DE|
AX|48794000|AXOR One|AXOR One Showerpipe with thermostat and overhead shower 280 1jet|Showerpipe|93.352.000|51.344.000|Chrome|DE|
AX|48794670|AXOR One|AXOR One Showerpipe with thermostat and overhead shower 280 1jet|Showerpipe|130.697.000|71.883.000|Matt Black|DE|
AX|48794140|AXOR One|AXOR One Showerpipe with thermostat and overhead shower 280 1jet|Showerpipe|140.029.000|77.016.000|Brushed Bronze|DE|
AX|48794340|AXOR One|AXOR One Showerpipe with thermostat and overhead shower 280 1jet|Showerpipe|140.029.000|77.016.000|Brushed Black Chrome|DE|

# Hansgrohe products
HG|13114007|Ecostat Comfort|Ecostat Comfort Bath thermostat for exposed installation|Thermostat exposed|17.380.000|10.080.000|Chrome|CN|
HG|13114147|Ecostat Comfort|Ecostat Comfort Bath thermostat for exposed installation|Thermostat exposed|26.064.000|15.117.000|Brushed Bronze|CN|
HG|13116007|Ecostat Comfort|Ecostat Comfort Shower thermostat for exposed installation|Thermostat exposed|13.600.000|7.888.000|Chrome|CN|
HG|13157007|ShowerTablet Select|ShowerTablet Select Bath thermostat 360 for exposed installation|Thermostat Exposed|11.094.000|6.435.000|Chrome|CN|
HG|13157677|ShowerTablet Select|ShowerTablet Select Bath thermostat 360 for exposed installation|Thermostat Exposed|13.872.000|8.046.000|Matt Black|CN|
HG|15380000|RainSelect|RainSelect Thermostat for concealed installation for 2 functions|Thermostat concealed|69.993.000|40.596.000|Chrome|DE|
HG|15380140|RainSelect|RainSelect Thermostat for concealed installation for 2 functions|Thermostat concealed|104.981.000|60.889.000|Brushed Bronze|DE|
HG|15380340|RainSelect|RainSelect Thermostat for concealed installation for 2 functions|Thermostat concealed|104.981.000|60.889.000|Brushed Black Chrome|DE|
HG|15380670|RainSelect|RainSelect Thermostat for concealed installation for 2 functions|Thermostat concealed|90.979.000|52.768.000|Matt Black|DE|
HG|15382000|RainSelect|RainSelect Thermostat for concealed installation for 4 functions|Thermostat concealed|96.278.000|55.841.000|Chrome|DE|
HG|15554000|ShowerSelect Comfort S|ShowerSelect Comfort S Thermostat for concealed installation for 2 functions|Thermostat Concealed|38.965.000|22.600.000|Chrome|DE|
HG|15554140|ShowerSelect Comfort S|ShowerSelect Comfort S Thermostat for concealed installation for 2 functions|Thermostat Concealed|58.468.000|33.911.000|Brushed Bronze|DE|
HG|15554340|ShowerSelect Comfort S|ShowerSelect Comfort S Thermostat for concealed installation for 2 functions|Thermostat Concealed|58.468.000|33.911.000|Brushed Black Chrome|DE|
HG|15554670|ShowerSelect Comfort S|ShowerSelect Comfort S Thermostat for concealed installation for 2 functions|Thermostat Concealed|54.547.000|31.637.000|Matt Black|DE|
HG|15572000|ShowerSelect Comfort E|ShowerSelect Comfort E Thermostat for concealed installation for 2 functions|Thermostat Concealed|38.965.000|22.600.000|Chrome|DE|
HG|15572670|ShowerSelect Comfort E|ShowerSelect Comfort E Thermostat for concealed installation for 2 functions|Thermostat Concealed|54.547.000|31.637.000|Matt Black|DE|
HG|15714007|Ecostat Square|Ecostat Square Thermostat for concealed installation for 2 functions|Thermostat concealed|25.033.000|14.519.000|Chrome|CN|
HG|15714677|Ecostat Square|Ecostat Square Thermostat for concealed installation for 2 functions|Thermostat concealed|35.050.000|20.329.000|Matt Black|CN|
HG|15763007|ShowerSelect|ShowerSelect Thermostat for concealed installation for 2 functions|Thermostat concealed|34.485.000|20.001.000|Chrome|CN|
HG|15763677|ShowerSelect|ShowerSelect Thermostat for concealed installation for 2 functions|Thermostat concealed|50.284.000|29.165.000|Matt Black|CN|
HG|24111000|Pulsify Select S|Pulsify Select S Hand shower 105 3jet Relaxation EcoSmart|Hand shower|1.931.000|1.120.000|Chrome|DE|
HG|24111670|Pulsify Select S|Pulsify Select S Hand shower 105 3jet Relaxation EcoSmart|Hand shower|2.827.000|1.640.000|Matt Black|DE|
HG|24141007|Pulsify S|Pulsify S Overhead shower 260 1jet|Overhead shower|11.488.000|6.663.000|Chrome|CN|
HG|24141677|Pulsify S|Pulsify S Overhead shower 260 1jet|Overhead shower|14.936.000|8.663.000|Matt Black|CN|
HG|24161000|Pulsify Select S|Pulsify Select S Shower set 105 3jet Relaxation EcoSmart with shower bar 65 cm|Shower set|5.768.000|3.345.000|Chrome|DE|
HG|24161670|Pulsify Select S|Pulsify Select S Shower set 105 3jet Relaxation EcoSmart with shower bar 65 cm|Shower set|8.064.000|4.677.000|Matt Black|DE|
HG|24241007|Pulsify S|Pulsify S Showerpipe 260 2jet with ShowerTablet Select 400|Showerpipe|46.306.000|26.857.000|Chrome|CN|
HG|24241677|Pulsify S|Pulsify S Showerpipe 260 2jet with ShowerTablet Select 400|Showerpipe|60.185.000|34.907.000|Matt Black|CN|
HG|24511000|Raindance Alive Select S|Raindance Alive Select S Hand shower 125 3jet EcoSmart|Hand shower|4.229.000|2.453.000|Chrome|DE|
HG|24511670|Raindance Alive Select S|Raindance Alive Select S Hand shower 125 3jet EcoSmart|Hand shower|5.495.000|3.187.000|Matt Black|DE|
HG|24541000|Raindance Alive S|Raindance Alive S Overhead shower 300 2jet EcoSmart with shower arm|Overhead shower|41.723.000|24.199.000|Chrome|DE|
HG|24541670|Raindance Alive S|Raindance Alive S Overhead shower 300 2jet EcoSmart with shower arm|Overhead shower|54.238.000|31.458.000|Matt Black|DE|
HG|24580000|Raindance Alive Q|Raindance Alive Q Showerpipe 210/340 1jet with ShowerSelect Comfort|Showerpipe|85.582.000|49.638.000|Chrome|DE|
HG|24580670|Raindance Alive Q|Raindance Alive Q Showerpipe 210/340 1jet with ShowerSelect Comfort|Showerpipe|111.251.000|64.526.000|Matt Black|DE|
HG|24590000|Raindance Alive Q|Raindance Alive Q Showerpipe 210/340 2jet with ShowerSelect Comfort|Showerpipe|95.848.000|55.592.000|Chrome|DE|
HG|24590670|Raindance Alive Q|Raindance Alive Q Showerpipe 210/340 2jet with ShowerSelect Comfort|Showerpipe|124.605.000|72.271.000|Matt Black|DE|
HG|24600000|Raindance Alive Select S|Raindance Alive Select S Shower set 125 3jet EcoSmart with shower bar Unica E Puro 65 cm|Shower set|15.963.000|9.259.000|Chrome|DE|
HG|24600670|Raindance Alive Select S|Raindance Alive Select S Shower set 125 3jet EcoSmart with shower bar Unica E Puro 65 cm|Shower set|21.943.000|12.727.000|Matt Black|DE|
HG|26176007|Crometta E|Crometta E Showerpipe 240 1jet with bath thermostat|Showerpipe|32.659.000|18.942.000|Chrome|CN|
HG|26177007|Crometta S|Crometta S Showerpipe 240 1jet with bath thermostat|Showerpipe|32.659.000|18.942.000|Chrome|CN|
HG|26226000|Rainfinity|Rainfinity Overhead shower 250 1jet with wall connector|Overhead shower|45.357.000|26.307.000|Chrome|FR|
HG|26226700|Rainfinity|Rainfinity Overhead shower 250 1jet with wall connector|Overhead shower|58.946.000|34.189.000|Matt White|FR|
HG|26230000|Rainfinity|Rainfinity Overhead shower 360 1jet with wall connector|Overhead shower|51.916.000|30.111.000|Chrome|FR|
HG|26230670|Rainfinity|Rainfinity Overhead shower 360 1jet with wall connector|Overhead shower|67.497.000|39.148.000|Matt Black|FR|
HG|26234000|Rainfinity|Rainfinity Overhead shower 360 3jet with wall connector|Overhead shower|71.632.000|41.547.000|Chrome|FR|
HG|26234670|Rainfinity|Rainfinity Overhead shower 360 3jet with wall connector|Overhead shower|93.114.000|54.006.000|Matt Black|FR|
HG|26239000|Raindance E|Raindance E Overhead shower 300 EcoSmart 1jet with shower arm|Overhead shower|34.276.000|19.880.000|Chrome|FR|
HG|26239670|Raindance E|Raindance E Overhead shower 300 EcoSmart 1jet with shower arm|Overhead shower|47.984.000|27.831.000|Matt Black|FR|
HG|26270007|Vernis Blend|Vernis Blend Hand shower 100 Vario Eco|Hand shower|1.075.000|624.000|Chrome|CN|
HG|26270677|Vernis Blend|Vernis Blend Hand shower 100 Vario Eco|Hand shower|1.512.000|877.000|Matt Black|CN|
HG|26272007|Vernis Blend|Vernis Blend Showerpipe 200 1jet Reno|Showerpipe Reno|17.369.000|10.074.000|Chrome|CN|
HG|26272677|Vernis Blend|Vernis Blend Showerpipe 200 1jet Reno|Showerpipe Reno|24.314.000|14.102.000|Matt Black|CN|
HG|26274007|Vernis Blend|Vernis Blend Showerpipe 200 1jet with bath thermostat|Showerpipe|27.563.000|15.987.000|Chrome|CN|
HG|26274677|Vernis Blend|Vernis Blend Showerpipe 200 1jet with bath thermostat|Showerpipe|32.088.000|18.611.000|Matt Black|CN|
HG|26515000|Raindance Select S|Raindance Select S Hand shower 120 3jet PowderRain EcoSmart|Hand shower|5.852.000|3.394.000|Chrome|FR|
HG|26515670|Raindance Select S|Raindance Select S Hand shower 120 3jet PowderRain EcoSmart|Hand shower|8.191.000|4.751.000|Matt Black|FR|
HG|26853000|Rainfinity|Rainfinity Showerpipe 360 1jet with ShowerTablet 350|Showerpipe|75.012.000|43.507.000|Chrome|DE|
HG|26853670|Rainfinity|Rainfinity Showerpipe 360 1jet with ShowerTablet 350|Showerpipe|93.768.000|54.385.000|Matt Black|FR|
HG|26864000|Rainfinity|Rainfinity Hand shower 130 3jet|Hand shower|6.384.000|3.703.000|Chrome|FR|
HG|26864670|Rainfinity|Rainfinity Hand shower 130 3jet|Hand shower|8.303.000|4.816.000|Matt Black|FR|
HG|29230000|Bidette|Bidette hand shower 1jet S EcoSmart for cold water with shower holder and shower hose 125 cm|Hygiene Shower / Bidette|6.381.000|3.701.000|Chrome|CN|
HG|29230670|Bidette|Bidette hand shower 1jet S EcoSmart for cold water with shower holder and shower hose 125 cm|Hygiene Shower / Bidette|8.919.000|5.173.000|Matt Black|DE|
HG|29232000|Bidette|Bidette hand shower 1jet S EcoSmart for warm water with shower holder and shower hose 125 cm|Hygiene Shower / Bidette|8.121.000|4.710.000|Chrome|CN|
HG|29232670|Bidette|Bidette hand shower 1jet S EcoSmart for warm water with shower holder and shower hose 125 cm|Hygiene Shower / Bidette|11.410.000|6.618.000|Matt Black|CN|
HG|31607007|Focus|Focus Single lever basin mixer 100 with pop-up waste set|1-hole basin mixer|6.867.000|3.983.000|Chrome|CN|
HG|31608007|Focus|Focus Single lever basin mixer 190 with pop-up waste set|1-hole basin mixer|8.237.000|4.777.000|Chrome|CN|
HG|31800007|Focus M41|Focus M41 Single lever kitchen mixer 240, 1jet|1-hole kitchen faucet|8.511.000|4.936.000|Chrome|CN|
HG|31815000|Focus M41|Focus M41 Single lever kitchen mixer 240, pull-out spray, 2jet|1-hole kitchen faucet|19.312.000|11.201.000|Chrome|DE|
HG|31815670|Focus M41|Focus M41 Single lever kitchen mixer 240, pull-out spray, 2jet|1-hole kitchen faucet|27.018.000|15.670.000|Matt Black|DE|
HG|31940007|Focus|Focus Single lever bath mixer for exposed installation|Bath mixer wall mounted|6.867.000|3.983.000|Chrome|CN|
HG|32506007|Metropol|Metropol Single lever basin mixer 110 with lever handle and pop-up waste set|1-hole basin mixer|15.749.000|9.134.000|Chrome|CN|
HG|32507677|Metropol|Metropol Single lever basin mixer 110 with lever handle and push-open waste set|1-hole basin mixer|22.480.000|13.038.000|Matt Black|CN|
HG|32512007|Metropol|Metropol Single lever basin mixer 260 with lever handle for wash bowls with push-open waste set|1-hole basin mixer|22.668.000|13.147.000|Chrome|CN|
HG|32512677|Metropol|Metropol Single lever basin mixer 260 with lever handle for wash bowls with push-open waste set|1-hole basin mixer|31.724.000|18.400.000|Matt Black|CN|
HG|32517007|Metropol|Metropol 3-hole basin mixer 160 with pop-up waste set|3-hole basin mixer|22.044.000|12.786.000|Chrome|CN|
HG|32517677|Metropol|Metropol 3-hole basin mixer 160 with pop-up waste set|3-hole basin mixer|30.112.000|17.465.000|Matt Black|CN|
HG|32526007|Metropol|Metropol Single lever basin mixer for concealed installation wall-mounted with lever handle and spout 22.5 cm|2-hole basin mixer concealed|20.153.000|11.689.000|Chrome|CN|
HG|32526670|Metropol|Metropol Single lever basin mixer for concealed installation wall-mounted with lever handle and spout 22.5 cm|2-hole basin mixer concealed|31.012.000|17.987.000|Matt Black|DE|
HG|32532000|Metropol|Metropol Single lever bath mixer floor-standing with lever handle|Bath mixer floorstanding|107.323.000|62.247.000|Chrome|DE|
HG|32532670|Metropol|Metropol Single lever bath mixer floor-standing with lever handle|Bath mixer floorstanding|150.253.000|87.147.000|Matt Black|DE|
HG|71100007|Logis|Logis Single lever basin mixer 100 with pop-up waste set|1-hole basin mixer|6.886.000|3.994.000|Chrome|CN|
HG|71160007|Logis E|Logis E Single lever basin mixer 70 with pop-up waste set|1-hole basin mixer|4.574.000|2.653.000|Chrome|CN|
HG|71161007|Logis E|Logis E Single lever basin mixer 100 with pop-up waste set|1-hole basin mixer|5.085.000|2.949.000|Chrome|CN|
HG|71162007|Logis E|Logis E Single lever basin mixer 230 with pop-up waste set|1-hole basin mixer|7.768.000|4.505.000|Chrome|CN|
HG|71400007|Logis|Logis Single lever bath mixer for exposed installation|Bath mixer wall mounted|7.648.000|4.436.000|Chrome|CN|
HG|71403007|Logis E|Logis E Single lever bath mixer for exposed installation|Bath mixer wall mounted|5.666.000|3.286.000|Chrome|CN|
HG|71440007|Vernis Blend|Vernis Blend Single lever bath mixer for exposed installation|Bath mixer wall mounted|5.401.000|3.133.000|Chrome|CN|
HG|71440677|Vernis Blend|Vernis Blend Single lever bath mixer for exposed installation|Bath mixer wall mounted|7.566.000|4.388.000|Matt Black|CN|
HG|71551007|Vernis Blend|Vernis Blend Single lever basin mixer 100 with pop-up waste set|1-hole basin mixer|4.835.000|2.804.000|Chrome|CN|
HG|71551677|Vernis Blend|Vernis Blend Single lever basin mixer 100 with pop-up waste set|1-hole basin mixer|6.725.000|3.901.000|Matt Black|CN|
HG|71710007|Talis E|Talis E Single lever basin mixer 110 with pop-up waste set|1-hole basin mixer|8.827.000|5.120.000|Chrome|CN|
HG|71710677|Talis E|Talis E Single lever basin mixer 110 with pop-up waste set|1-hole basin mixer|14.816.000|8.593.000|Matt Black|CN|
HG|71716000|Talis E|Talis E Single lever basin mixer 240 with pop-up waste set|1-hole basin mixer|17.695.000|10.263.000|Chrome|RS|
HG|71716670|Talis E|Talis E Single lever basin mixer 240 with pop-up waste set|1-hole basin mixer|22.715.000|13.175.000|Matt Black|DE|
HG|71740007|Talis E|Talis E Single lever bath mixer for exposed installation|Bath mixer wall mounted|11.552.000|6.700.000|Chrome|CN|
HG|71740670|Talis E|Talis E Single lever bath mixer for exposed installation|Bath mixer wall mounted|17.788.000|10.317.000|Matt Black|DE|
HG|72444007|Rebris S|Rebris S 4-hole rim mounted bath mixer|Bath mixer rim-mounted|18.050.000|10.469.000|Chrome|CN|
HG|72444677|Rebris S|Rebris S 4-hole rim mounted bath mixer|Bath mixer rim-mounted|22.564.000|13.087.000|Matt Black|CN|
HG|72517007|Rebris S|Rebris S Single lever basin mixer 110 with pop-up waste set|1-hole basin mixer|5.641.000|3.272.000|Chrome|CN|
HG|72517677|Rebris S|Rebris S Single lever basin mixer 110 with pop-up waste set|1-hole basin mixer|7.046.000|4.087.000|Matt Black|CN|
HG|72523007|Rebris S|Rebris S Single lever basin mixer 240 for wash bowls with push-open waste set|1-hole basin mixer|8.749.000|5.074.000|Chrome|CN|
HG|72523677|Rebris S|Rebris S Single lever basin mixer 240 for wash bowls with push-open waste set|1-hole basin mixer|10.935.000|6.342.000|Matt Black|CN|
HG|72800000|Talis M54|Talis M54 Single lever kitchen mixer 210, pull-out spray, 2jet|1-hole kitchen faucet|19.467.000|11.291.000|Chrome|DE|
HG|72800670|Talis M54|Talis M54 Single lever kitchen mixer 210, pull-out spray, 2jet|1-hole kitchen faucet|25.306.000|14.677.000|Matt Black|DE|
HG|73014007|Tecturis E|Tecturis E Single lever basin mixer 110 CoolStart with pop-up waste set|1-hole basin mixer|9.140.000|5.301.000|Chrome|CN|
HG|73014677|Tecturis E|Tecturis E Single lever basin mixer 110 CoolStart with pop-up waste set|1-hole basin mixer|12.797.000|7.422.000|Matt Black|CN|
HG|73070007|Tecturis E|Tecturis E Single lever basin mixer 240 Fine CoolStart EcoSmart+ for wash bowls with push-open waste set|1-hole basin mixer|15.397.000|8.930.000|Chrome|CN|
HG|73070677|Tecturis E|Tecturis E Single lever basin mixer 240 Fine CoolStart EcoSmart+ for wash bowls with push-open waste set|1-hole basin mixer|21.552.000|12.500.000|Matt Black|CN|
HG|73314007|Tecturis S|Tecturis S Single lever basin mixer 110 CoolStart with pop-up waste set|1-hole basin mixer|8.465.000|4.910.000|Chrome|CN|
HG|73314677|Tecturis S|Tecturis S Single lever basin mixer 110 CoolStart with pop-up waste set|1-hole basin mixer|11.852.000|6.874.000|Matt Black|CN|
HG|73370007|Tecturis S|Tecturis S Single lever basin mixer 240 Fine CoolStart for wash bowls with push-open waste set|1-hole basin mixer|14.256.000|8.268.000|Chrome|CN|
HG|73370677|Tecturis S|Tecturis S Single lever basin mixer 240 Fine CoolStart for wash bowls with push-open waste set|1-hole basin mixer|19.959.000|11.576.000|Matt Black|CN|
HG|73830000|Aquno Select M81|Aquno Select M81 Single lever kitchen mixer 250, pull-out spout, 2jet, sBox|1-hole kitchen faucet|38.929.000|22.579.000|Chrome|DE|
HG|73830670|Aquno Select M81|Aquno Select M81 Single lever kitchen mixer 250, pull-out spout, 2jet, sBox|1-hole kitchen faucet|54.498.000|31.609.000|Matt Black|DE|
HG|74720007|Zesis S|Zesis S Single lever basin mixer 100 CoolStart with pop-up waste set|1-hole basin mixer|5.917.000|3.432.000|Chrome|CN|
HG|74720677|Zesis S|Zesis S Single lever basin mixer 100 CoolStart with pop-up waste set|1-hole basin mixer|7.395.000|4.289.000|Matt Black|CN|
HG|74750007|Zesis S|Zesis S Single lever basin mixer for concealed installation wall-mounted with spout 19,5 cm|2-hole basin mixer concealed|9.471.000|5.493.000|Chrome|CN|
HG|74750677|Zesis S|Zesis S Single lever basin mixer for concealed installation wall-mounted with spout 19,5 cm|2-hole basin mixer concealed|11.834.000|6.864.000|Matt Black|CN|
HG|75020007|Vivenis|Vivenis Single lever basin mixer 110 with pop-up waste set|1-hole basin mixer|9.864.000|5.721.000|Chrome|CN|
HG|75020677|Vivenis|Vivenis Single lever basin mixer 110 with pop-up waste set|1-hole basin mixer|13.800.000|8.004.000|Matt Black|CN|
HG|75046007|Vivenis|Vivenis Single lever basin mixer 250 for washbowls with push-open waste set|1-hole basin mixer|15.170.000|8.799.000|Chrome|CN|
HG|75046677|Vivenis|Vivenis Single lever basin mixer 250 for washbowls with push-open waste set|1-hole basin mixer|21.237.000|12.317.000|Matt Black|CN|
HG|75050007|Vivenis|Vivenis Single lever basin mixer for concealed installation wall-mounted with spout 19,2 cm|2-hole basin mixer concealed|13.555.000|7.862.000|Chrome|CN|
HG|75050677|Vivenis|Vivenis Single lever basin mixer for concealed installation wall-mounted with spout 19,2 cm|2-hole basin mixer concealed|18.977.000|11.007.000|Matt Black|CN|
HG|75443007|Vivenis|Vivenis 4-hole rim mounted bath mixer|Bath mixer rim-mounted|34.043.000|19.745.000|Chrome|CN|
HG|75445000|Vivenis|Vivenis Single lever bath mixer floor-standing|Bath mixer floorstanding|88.676.000|51.432.000|Chrome|DE|
HG|75445670|Vivenis|Vivenis Single lever bath mixer floor-standing|Bath mixer floorstanding|124.148.000|72.006.000|Matt Black|DE|
"""

def parse_axor_hg_more():
    products = []
    for line in AXOR_HG_MORE_RAW.strip().split('\n'):
        if not line or not (line.startswith('AX|') or line.startswith('HG|')):
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
    p = parse_axor_hg_more()
    print(f"Parsed {len(p)} extra AXOR & Hansgrohe products")
