import type {Code} from './quiz';
export const creatorRoles:Record<Code,{position:string;tasks:string;handoff:string}>={
 V:{position:'摄影／视觉创作',tasks:'设计构图与机位，控制光线，拍摄主镜头、细节与补充素材',handoff:'按脚本提供清晰、稳定、可供剪辑的素材'},
 R:{position:'内容梳理型剪辑',tasks:'筛选素材、整理信息顺序、剪辑节奏，处理字幕与音频并导出',handoff:'把素材整理成信息清楚、节奏顺畅的成片；操作能力需看作品'},
 I:{position:'创意型编导',tasks:'提出选题、开场钩子、反转和有趣拍法，写成可执行脚本',handoff:'向摄影和出镜说明创意、镜头与表演要求'},
 N:{position:'叙事型编导',tasks:'挖掘用车故事和生活细节，梳理起承转合，撰写脚本与台词',handoff:'让摄影和出镜知道故事重点及情绪推进'},
 E:{position:'表达型出镜',tasks:'完成口播、讲解、表演和即兴表达，配合镜头反复录制',handoff:'提供自然、清楚、可使用的出镜内容'},
 C:{position:'互动型出镜／采访搭档',tasks:'提问、追问、接话，引导被访者放松，完成双人互动',handoff:'与表达型出镜互补；关照他人不直接代表采访能力'},
 O:{position:'统筹型编导',tasks:'把方案拆成镜头清单，协调分工、时间、场地及补拍，推动交付',handoff:'与摄影、出镜、剪辑确认进度及最终交片要求'}
};
