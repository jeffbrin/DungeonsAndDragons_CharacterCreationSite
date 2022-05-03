Each model should be initialized in the following order.
The tables should be made in the order they are written.
Table dependencies are indicated in brackets.

# Original Design

## UserModel
* User - 
  * CREATE TABLE IF NOT EXISTS User (Id INT, Username TEXT, Password TEXT, PRIMARY KEY(Id));

## SpellModel
* Spell School - 
  * CREATE TABLE IF NOT EXISTS SpellSchool (Id INT, Name TEXT, PRIMARY KEY(Id));
* Spell (spell school) - 
  * CREATE TABLE IF NOT EXISTS Spell(Id INT, SchoolId INT,
  UserId INT, Level INT, Description TEXT, Name TEXT, CastingTime TEXT, Tange TEXT, Verbal BOOLEAN, Somatic BOOLEAN, Material BOOLEAN, Materials TEXT NULL, Duration TEXT, Damage TEXT NULL, PRIMARY KEY(Id), FOREIGN KEY (SchoolId) REFERENCES SpellSchool(Id), FOREIGN KEY (UserId) REFERENCES User(Id));

## BackgroundModel
* Background - 
  * CREATE TABLE IF NOT EXISTS Background(Id INT, Name TEXT, Description TEXT, PRIMARY KEY (Id));
* Background Feature (background) - 
  * CREATE TABLE IF NOT EXISTS BackgroundFeature(BackgroundId INT, Name VARCHAR(200), Description TEXT, FOREIGN KEY (BackgroundId) REFERENCES Background(Id), PRIMARY KEY (BackgroundId, Name));

## ClassModel
* Class - 
  * CREATE TABLE IF NOT EXISTS Class(Id INT, Name TEXT, HitDie TEXT, PRIMARY KEY (Id));
* Class Feature (class) - 
  * CREATE TABLE IF NOT EXISTS ClassFeature(ClassId INT, Name VARCHAR(200), Description TEXT, Level INT, FOREIGN KEY (ClassId) REFERENCES Class(Id), PRIMARY KEY (ClassId, Name));
* Class Permitted Spell (class, spell) - 
  * CREATE TABLE IF NOT EXISTS ClassPermittedSpell(ClassId
INT, SpellId INT, FOREIGN KEY (ClassId) REFERENCES Class(Id),
FOREIGN KEY (SpellId) REFERENCES Spell(Id), PRIMARY KEY (ClassId, SpellId));

## RaceModel
* Race - 
  * CREATE TABLE IF NOT EXISTS Race(Id INT, Name TEXT, Description TEXT, PRIMARY KEY(Id));
* Racial Trait (race) - 
  * CREATE TABLE IF NOT EXISTS RacialTrait(RaceId INT, Name VARCHAR(200), Description TEXT, PRIMARY KEY(RaceId, Name), FOREIGN KEY (RaceId) REFERENCES Race(Id));

## CharacterModel
* Ethics - 
  * CREATE TABLE IF NOT EXISTS Ethics(Id INT, Name TEXT, PRIMARY KEY(Id));
* Morality - 
  * CREATE TABLE IF NOT EXISTS Morality(Id INT, Name TEXT, PRIMARY KEY(Id));
* Ability - 
  * CREATE TABLE IF NOT EXISTS Ability(Id INT, Name TEXT, PRIMARY KEY(Id));
* PlayerCharacter (background, class, user, race, ethics, morality) - 
  * CREATE TABLE IF NOT EXISTS PlayerCharacter(Id INT, UserId INT, ClassId INT, RaceId INT, EthicsId INT, MoralityId INT, BackgroundId INT, Name TEXT, MaxHp INT, CurrentHp INT, Level INT, ArmorClass INT, Speed INT, Initiative INT, Experience INT, PRIMARY KEY(Id), FOREIGN KEY (UserId) REFERENCES User(Id), FOREIGN KEY (ClassId) REFERENCES Class(Id), FOREIGN KEY (RaceId) REFERENCES Race(Id), FOREIGN KEY (EthicsId) REFERENCES Ethics(Id), FOREIGN KEY (MoralityId) REFERENCES Morality(Id), FOREIGN KEY (BackgroundId) REFERENCES Background(Id));
* Skill (ability) - 
  * CREATE TABLE IF NOT EXISTS Skill(Id INT, AbilityId INT, Name TEXT, PRIMARY KEY(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id));
* Known Spell (playercharacter, spell) - 
  * CREATE TABLE IF NOT EXISTS KnownSpell(SpellId INT, CharacterId INT, FOREIGN KEY (SpellId) REFERENCES Spell(Id), FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), PRIMARY KEY (SpellId, CharacterId));
* Saving Throw Proficiency (playercharacter, ability) - 
  * CREATE TABLE IF NOT EXISTS SavingThrowProficiency(CharacterId INT, AbilityId INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id), PRIMARY KEY (CharacterId, AbilityId));
* Skill Proficiency (playercharacter, skill) -
  * CREATE TABLE IF NOT EXISTS SkillProficiency(CharacterId INT, SkillId INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (SkillId) REFERENCES Skill(Id), PRIMARY KEY (CharacterId, SkillId));
* Skill Expertise (playercharacter, skill) - 
  * CREATE TABLE IF NOT EXISTS SkillExpertise(CharacterId INT, SkillId INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (SkillId) REFERENCES Skill(Id), PRIMARY KEY (CharacterId, SkillId));
* Owned Item (playercharacter) -
  * CREATE TABLE IF NOT EXISTS OwnedItem(CharacterId INT, Name VARCHAR(200), Count INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), PRIMARY KEY (CharacterId, Name));
* Saving Throw Bonus (playercharacter, ability) -
  * CREATE TABLE IF NOT EXISTS SavingThrowBonus(CharacterId INT, AbilityId INT, Bonus INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id), PRIMARY KEY(AbilityId, CharacterId));
* Ability Score (playercharacter, ability) -
  * CREATE TABLE IF NOT EXISTS AbilityScore(CharacterId INT, AbilityId INT, Score INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id), PRIMARY KEY(AbilityId, CharacterId));

# Potential refactor

Split Character Model into 

## CharacterModel
* Ethics
* Morality
* PlayerCharacter (background, class, user, race, ethics, morality)
* Known Spell (playercharacter, spell)
* Owned Item (playercharacter)

## CharacterStatisticsModel
* Ability
* Skill (ability)
* Saving Throw Proficiency (playercharacter, ability)
* Skill Proficiency (playercharacter, skill)
* Skill Expertise (playercharacter, skill)
* Saving Throw Bonus (playercharacter, ability)
* Ability Score (playercharacter, ability)