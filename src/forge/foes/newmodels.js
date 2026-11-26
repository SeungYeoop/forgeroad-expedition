// 새 지역 몬스터 그림 (id → 2D 픽셀 스펙). 워커와 본 스레드가 같이 쓴다 (models.js)
import { pxGoat, pxQueen, pxShaman, pxMole } from "./pgm3.js";
import * as SB from "./px_sb.js";
import * as DS from "./px_ds.js";
import * as MB from "./px_mb.js";
import * as GS from "./px_gs.js";
import * as IV from "./px_iv.js";
import * as LC from "./px_lc.js";
import * as RH from "./px_rh.js";
import * as GB from "./px_gb.js";
import * as AF from "./px_af.js";
import * as MS from "./px_ms.js";
import * as SC from "./px_sc.js";
import * as AH from "./px_ah.js";
import * as DM from "./px_dm.js";
export const NEW_MODELS = {
  // 모스스파이어 (노랑)
  ms_monk: MS.pxMonk, ms_yak: MS.pxYak, ms_beetle: MS.pxBellBeetle, ms_abbot: MS.pxAbbot,
  ms_crane: MS.pxCrane, ms_flag: MS.pxFlag, ms_mossling: MS.pxMossling, ms_bellguard: MS.pxBellguard,
  ms_eagle: MS.pxEagle, ms_kite: MS.pxKite, ms_scroll: MS.pxScroll, ms_sage: MS.pxSage,
  sc_puff: SC.pxPuff, sc_slug: SC.pxSporeSlug, sc_capling: SC.pxCapling, sc_matriarch: SC.pxMatriarch,
  sc_beetle: SC.pxCapBeetle, sc_spore: SC.pxSpore, sc_frog: SC.pxFrog, sc_witch: SC.pxWitch,
  sc_ray: SC.pxRay, sc_jelly: SC.pxSporeJelly, sc_wisp: SC.pxMycWisp, sc_queen: SC.pxSpiderQueen,
  ah_hound: AH.pxMastiff, ah_footman: AH.pxFootman, ah_ooze: AH.pxOoze, ah_bulwark: AH.pxBulwark,
  ah_xbow: AH.pxCrossbow, ah_dfly: AH.pxDragonfly, ah_banner: AH.pxBearer, ah_lancer: AH.pxLancer,
  ah_clock: AH.pxClockFalcon, ah_helm: AH.pxWingHelm, ah_herald: AH.pxHerald, ah_griffon: AH.pxGriffon,
  dm_fox: DM.pxFox, dm_beetle: DM.pxDungBeetle, dm_viper: DM.pxViper, dm_croc: DM.pxCroc,
  dm_raider: DM.pxRaider, dm_locust: DM.pxLocusts, dm_glass: DM.pxHourglass, dm_sphinx: DM.pxSphinx,
  dm_mirage: DM.pxMirage, dm_fish: DM.pxFlyfish, dm_disc: DM.pxSundial, dm_djinn: DM.pxDjinn,
  // 애쉬펠 (노랑)
  af_ashling: AF.pxAshling, af_hound: AF.pxChainHound, af_brazier: AF.pxBrazier, af_jailer: AF.pxJailer,
  af_crow: AF.pxCrow, af_cinder: AF.pxCinder, af_wraith: AF.pxWraith, af_drake: AF.pxDrake,
  af_censer: AF.pxCenser, af_bat: AF.pxFireBat, af_shackle: AF.pxShackle, af_phoenix: AF.pxPhoenix,
  // 글래스블룸 (노랑)
  gb_snail: GB.pxSnail, gb_gardener: GB.pxGardener, gb_pot: GB.pxPot, gb_golem: GB.pxGolem,
  gb_moth: GB.pxMoth, gb_bee: GB.pxBee, gb_vine: GB.pxVine, gb_flytrap: GB.pxFlytrap,
  gb_prism: GB.pxPrism, gb_hummer: GB.pxHummer, gb_shard: GB.pxShard, gb_peacock: GB.pxPeacock,
  gm_goat: pxGoat, gm_queen: pxQueen, gm_shaman: pxShaman, gm_mole: pxMole,
  // 스톤브리지
  sb_lizard: SB.pxLizard, sb_statue: SB.pxStatue, sb_mason: SB.pxMason, sb_warden: SB.pxWarden,
  sb_monkey: SB.pxMonkey, sb_jar: SB.pxJar, sb_swallow: SB.pxSwallow, sb_griffin: SB.pxGriffin,
  sb_rune: SB.pxRune, sb_gargoyle: SB.pxGargoyle, sb_ghost: SB.pxGhost, sb_wyvern: SB.pxWyvern,
  // 드립스톤
  ds_bat: DS.pxCaveBat, ds_mimic: DS.pxStalMimic, ds_drop: DS.pxDrop, ds_giant: DS.pxLimeGiant,
  ds_newt: DS.pxNewt, ds_leech: DS.pxLeech, ds_moss: DS.pxGlowMoss, ds_eel: DS.pxEel,
  ds_beetle: DS.pxRockBeetle, ds_echo: DS.pxEcho, ds_centipede: DS.pxCentipede, ds_basilisk: DS.pxBasilisk,
  // 모스바크
  mb_turtle: MB.pxTurtle, mb_thorn: MB.pxThorn, mb_beetle: MB.pxStag, mb_troll: MB.pxTroll,
  mb_owl: MB.pxOwl, mb_squirrel: MB.pxSquirrel, mb_moth: MB.pxMoth, mb_mantis: MB.pxMantis,
  mb_toad: MB.pxToad, mb_firefly: MB.pxFirefly, mb_crayfish: MB.pxCrayfish, mb_toadking: MB.pxToadKing,
  // 그린스텝
  gs_sheep: GS.pxSheep, gs_rabbit: GS.pxRabbit, gs_sprout: GS.pxSprout, gs_ram: GS.pxRam,
  gs_sparrow: GS.pxSparrows, gs_jelly: GS.pxJelly, gs_knight: GS.pxKnight, gs_ladybug: GS.pxLadybug,
  gs_hawk: GS.pxHawk, gs_raincloud: GS.pxRainCloud, gs_pinwheel: GS.pxPinwheel, gs_whale: GS.pxWhale,
  // 아이언베인
  iv_rat: IV.pxRats, iv_kobold: IV.pxKobold, iv_moth: IV.pxLampMoth, iv_foreman: IV.pxForeman,
  iv_pillbug: IV.pxPillbug, iv_rustbug: IV.pxRustbug, iv_oregolem: IV.pxOreGolem, iv_drill: IV.pxDrill,
  iv_gasshroom: IV.pxGasShroom, iv_ghost: IV.pxGhostMiner, iv_scorpion: IV.pxCrystalScorp, iv_worm: IV.pxMineWorm,
  // 리프크라운
  lc_larva: LC.pxLarva, lc_chameleon: LC.pxChameleon, lc_hedgehog: LC.pxHedgehog, lc_spider: LC.pxSpider,
  lc_magpie: LC.pxMagpie, lc_butterfly: LC.pxButterfly, lc_chick: LC.pxChicks, lc_mother: LC.pxMother,
  lc_amber: LC.pxAmber, lc_archer: LC.pxArcher, lc_woodpecker: LC.pxWoodpecker, lc_guardian: LC.pxGuardian,
  // 루트홀로우
  rh_hand: RH.pxRootHand, rh_gnome: RH.pxGnome, rh_grub: RH.pxGrubs, rh_bear: RH.pxRootBear,
  rh_shroom: RH.pxShroomKid, rh_balloon: RH.pxBalloon, rh_deer: RH.pxMycoDeer, rh_king: RH.pxMushKing,
  rh_clod: RH.pxClod, rh_wraith: RH.pxWraith, rh_snail: RH.pxSnail, rh_heart: RH.pxRootHeart,
};
