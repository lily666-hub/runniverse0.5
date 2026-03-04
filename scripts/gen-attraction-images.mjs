import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// 加载 .env（以及可选的 .env.local）
dotenv.config();
try {
  const localEnvPath = path.resolve('.env.local');
  if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
  }
} catch {}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const outBaseDir = path.resolve('public/pictures/attractions');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const attractions = [
  { route: '2', id: '2-1', name: '湖心岛风光', prompt: '上海世纪公园湖心岛风光，环湖步道与树影交织，清晨湖面如镜，倒映蓝天白云与绿树，真实照片，专业摄影，宁静氛围，高质量，4k' },
  { route: '2', id: '2-2', name: '樱花园步道', prompt: '上海世纪公园樱花园步道，春季粉白樱花拱廊覆盖步道，人行步道平缓，真实照片，柔和光线，写实风格，4k' },
  { route: '2', id: '2-3', name: '音乐喷泉广场', prompt: '上海世纪公园音乐喷泉广场，夜晚灯光与水柱交织，喷泉随音乐节奏起舞，人群氛围活跃，真实照片，夜景摄影，4k' },
  { route: '2', id: '2-4', name: '观鸟台湿地', prompt: '上海世纪公园湿地观鸟台，近水湿地生态良好，木栈道与水生植物，常见水鸟栖息，真实照片，自然生态，4k' },
  { route: '2', id: '2-5', name: '梅花园四季', prompt: '上海世纪公园梅花园，四季色彩丰富，梅花盛开香气扑鼻，步道平整，真实照片，植物园氛围，4k' },

  { route: '3', id: '3-1', name: '光华楼广场', prompt: '复旦大学光华楼广场，校园地标建筑前开阔广场，轴线视角稳重，清晨或傍晚柔和光影，真实照片，建筑摄影，4k' },
  { route: '3', id: '3-2', name: '相辉堂历史建筑', prompt: '复旦大学相辉堂，老式砖墙与门楣细节保存完好，历史建筑人文气息浓郁，真实照片，柔和自然光，4k' },
  { route: '3', id: '3-3', name: '主图书馆阅览区', prompt: '复旦大学主图书馆外立面现代简洁，与草坪空间形成对话，学习氛围浓厚，真实照片，现代建筑，4k' },
  { route: '3', id: '3-4', name: '燕园林荫', prompt: '复旦大学燕园林荫小径，树影斑驳，四季色彩变化丰富，步道平缓，真实照片，自然园林，4k' },
  { route: '3', id: '3-5', name: '体育馆跑道', prompt: '复旦大学体育馆标准跑道设施完善，跑后拉伸与训练便利，运动氛围浓厚，真实照片，运动场景，4k' },

  { route: '4', id: '4-1', name: '樱花大道拱廊', prompt: '上海中山公园樱花大道春季粉白樱花交织成拱廊，空气清新，人流秩序良好，真实照片，樱花季，4k' },
  { route: '4', id: '4-2', name: '观景台远眺', prompt: '上海中山公园观景台，俯瞰园区绿植与水面，光线充足，真实照片，俯瞰视角，4k' },
  { route: '4', id: '4-3', name: '荷花池倒影', prompt: '上海中山公园荷花池，夏季荷花盛开，水面倒影构成柔和画面，真实照片，静谧氛围，4k' },
  { route: '4', id: '4-4', name: '竹林小径', prompt: '上海中山公园竹林小径，竹影婆娑，清风拂面，阴凉舒适，真实照片，自然小径，4k' },
  { route: '4', id: '4-5', name: '梅园静赏', prompt: '上海中山公园梅园，冬末早春梅花吐蕊，淡雅香气，景石与枝影相映，真实照片，写意园林，4k' },

  { route: '5', id: '5-1', name: '东方明珠近景', prompt: '上海东方明珠近景，标志性球体与塔身细节，夜色灯光璀璨，都市光影，真实照片，夜景建筑摄影，4k' },
  { route: '5', id: '5-2', name: '上海中心裙楼', prompt: '上海中心裙楼空间开阔，玻璃立面倒映城市天际线，高低层次丰富，真实照片，现代摩天大楼，4k' },
  { route: '5', id: '5-3', name: '环球金融中心天桥视角', prompt: '上海环球金融中心天桥视角，俯瞰车流与人群秩序线条，傍晚光线柔和，真实照片，城市节奏，4k' },
  { route: '5', id: '5-4', name: '金茂大厦中庭', prompt: '上海金茂大厦中庭，结构层次分明，几何对称美学，真实照片，室内建筑摄影，4k' },
  { route: '5', id: '5-5', name: '正大广场夜景', prompt: '上海正大广场夜景，商业步行街霓虹与人群交织，活力四射，真实照片，夜景街拍，4k' },

  { route: '6', id: '6-1', name: '石库门里弄', prompt: '上海新天地石库门里弄，灰砖墙与门楣细节精致，历史与生活的温度，真实照片，街区建筑，4k' },
  { route: '6', id: '6-2', name: '田子坊创意工坊', prompt: '上海田子坊创意工坊，老厂房改造，手作与涂鸦并存，小巷曲折，真实照片，文艺街区，4k' },
  { route: '6', id: '6-3', name: '思南公馆花园', prompt: '上海思南公馆花园，法式风情庭院与绿植相映，安静优雅，真实照片，欧式庭院，4k' },
  { route: '6', id: '6-4', name: '复兴公园林荫道', prompt: '上海复兴公园林荫道，林荫浓密步道平整，清晨宁静，真实照片，城市公园，4k' },
  { route: '6', id: '6-5', name: '孙中山故居外景', prompt: '上海孙中山故居外景，立面端庄朴素，近代史迹文化氛围，真实照片，历史建筑，4k' },
];

async function generateWithRetry(prompt, outPath, attempts = 3) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await client.images.generate({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
      });
      const b64 = res.data[0].b64_json;
      const buffer = Buffer.from(b64, 'base64');
      fs.writeFileSync(outPath, buffer);
      return true;
    } catch (err) {
      lastErr = err;
      const waitMs = 1000 * i; // 线性退避
      console.warn(`Attempt ${i} failed: ${err?.message || err}. Retrying in ${waitMs}ms...`);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
  console.error('All retry attempts failed:', lastErr?.message || lastErr);
  return false;
}

async function generateAll() {
  ensureDir(outBaseDir);

  for (const item of attractions) {
    const dir = path.join(outBaseDir, item.route);
    ensureDir(dir);
    const outPath = path.join(dir, `${item.id}.jpg`);

    try {
      console.log(`Generating: [${item.route}] ${item.id} - ${item.name}`);
      const ok = await generateWithRetry(item.prompt, outPath, 3);
      if (ok) {
        console.log(`Saved: ${outPath}`);
      } else {
        console.error(`Failed after retries: ${item.id} - ${item.name}`);
      }
    } catch (err) {
      console.error(`Failed: ${item.id} - ${item.name}`, err?.message || err);
    }
  }

  console.log('All generation attempts finished.');
}

generateAll();